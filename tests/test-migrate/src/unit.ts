import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Discovers direct migration units without preparing a product fixture.
 *
 * Cases import caller-built migration artifacts and author their OpenAPI
 * inputs. Generated SDK execution remains in the integration entry.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor discovers matching exports under features, awaits each in serial order and propagates assertion failures. A zero-discovery guard rejects an empty success.
 * @evidence contracts/common.md#clear-and-simple-design One entry configures discovery, reports each outcome and rejects zero cases; fixture preparation stays in the integration entry and temporary outputs are owned by their cases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry calls the built e2e executor and built migration operations through ordinary imports. It replaces no resolver or product operation and supplies no expected output.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies authored inputs, caller-built artifacts and the separate generated SDK population; failures and discovered count remain visible.
 */
export async function main(): Promise<void> {
  const report = await DynamicExecutor.assert({
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
  if (report.executions.length === 0)
    throw new Error("No migrate unit test function has been discovered.");
  console.log(`Migrate units: ${report.executions.length}; ${report.time} ms`);
}

if (require.main === module || process.argv[1] === __filename)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
