import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Discovers TypeScript and JavaScript SDK units against caller-built packages.
 *
 * These cases call generators directly; fixture compilation and backend
 * requests remain in the separate integration entry.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor discovers matching exports under features for the entry's source extension and ordinary JavaScript, awaits each in serial order and aggregates their first assertion failures. Deduplicated extensions prevent double execution when the entry itself is JavaScript; a total zero-discovery guard rejects empty success.
 * @evidence contracts/common.md#clear-and-simple-design One entry discovers both authored languages in its existing process, reports each outcome and rejects their combined failures or zero cases. Neither language population prevents the other executing after an assertion failure; fixture preparation stays in the integration entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry calls the built e2e executor and built SDK operations through ordinary imports. It replaces no resolver or product operation and supplies no expected output.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller-built artifacts and the separate fixture/backend population; failures and discovered count remain visible.
 */
export async function main(): Promise<void> {
  const reports: DynamicExecutor.IReport[] = [];
  const extensions = new Set([
    __filename.substring(__filename.lastIndexOf(".") + 1),
    "js",
  ]);
  for (const extension of extensions)
    reports.push(
      await DynamicExecutor.validate({
        parameters: () => [],
        location: __dirname + "/features",
        prefix: "test",
        extension,
        simultaneous: 1,
        onComplete: (execution) =>
          console.log(
            ` - ${execution.name}: ${execution.error ? "failed" : "passed"}`,
          ),
      }),
    );
  const executions = reports.flatMap((report) => report.executions);
  if (executions.length === 0)
    throw new Error("No SDK unit test function has been discovered.");
  console.log(
    `SDK units: ${executions.length}; ${reports.reduce((sum, report) => sum + report.time, 0)} ms`,
  );
  const failures = executions
    .map((execution) => execution.error)
    .filter((error): error is Error => error !== null);
  if (failures.length) throw new AggregateError(failures, "SDK unit failures");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
