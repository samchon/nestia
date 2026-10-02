import { DynamicExecutor } from "@nestia/e2e";

/**
 * Discovers direct validator tests and the relocated CLI and editor boundaries.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor.assert executes every test-prefixed source export serially and its report must contain at least one execution before this entry can succeed.
 * @evidence contracts/common.md#clear-and-simple-design One discovery operation owns selection, execution reporting and the empty-population guard; each case owns its actual behavioral assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry invokes actual exports without retrying or substituting a passing result for failed discovery or execution.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes direct validator cases from CLI and editor boundaries and identifies the entry's discovery responsibility.
 * @evidence contracts/portability.md#os-neutral-implementation DynamicExecutor receives the native compiled entry directory and its actual extension; filesystem module loading differences belong to DynamicExecutor.
 */
export async function main(): Promise<void> {
  const report: DynamicExecutor.IReport = await DynamicExecutor.assert({
    parameters: () => [],
    location: __dirname + "/features",
    prefix: "test",
    onComplete: (exec) => {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      console.log(` - ${exec.name}: ${elapsed.toLocaleString()} ms`);
    },
    simultaneous: 1,
    // ttsx executes the .ts sources directly, so the discovered files carry
    // the extension of THIS file, not a compiled "js". A hardcoded "js" made
    // discovery return zero tests and the suite pass vacuously.
    extension: __filename.substring(__filename.length - 2),
  });
  if (report.executions.length === 0)
    throw new Error("No e2e test function has been discovered.");
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
