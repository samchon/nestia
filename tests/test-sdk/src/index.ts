import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Discovers SDK units against caller-built packages.
 *
 * These cases call generators directly; fixture compilation and backend
 * requests remain in the separate integration entry.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor discovers matching exports under features for the entry's executing extension, awaits each in serial order and aggregates their first assertion failures. A zero-discovery guard rejects empty success.
 * @evidence contracts/common.md#clear-and-simple-design One authored TypeScript population uses one discovery pass, reports each outcome and rejects failures or zero cases. Fixture preparation stays in the separate integration entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry calls the built e2e executor and built SDK operations through ordinary imports. It replaces no resolver or product operation and supplies no expected output.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller-built artifacts and the separate fixture/backend population; failures and discovered count remain visible.
 */
export async function main(): Promise<void> {
  const report = await DynamicExecutor.validate({
    parameters: () => [],
    location: __dirname + "/features",
    prefix: "test",
    extension: __filename.substring(__filename.lastIndexOf(".") + 1),
    simultaneous: 1,
    onComplete: (execution) =>
      console.log(
        ` - ${execution.name}: ${execution.error ? "failed" : "passed"}`,
      ),
  });
  const executions = report.executions;
  if (executions.length === 0)
    throw new Error("No SDK unit test function has been discovered.");
  console.log(`SDK units: ${executions.length}; ${report.time} ms`);
  const failures = executions
    .map((execution) => execution.error)
    .filter((error): error is Error => error !== null);
  if (failures.length) throw new AggregateError(failures, "SDK unit failures");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
