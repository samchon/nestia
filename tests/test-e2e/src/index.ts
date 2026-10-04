import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Discovers direct e2e-package units against caller-built artifacts.
 *
 * The public ttsx entry checks and executes this language program once with
 * plugin discovery disabled. No product fixture or native host is needed.
 *
 * @evidence contracts/common.md#principled-implementation The built executor discovers matching exports, awaits each assertion and propagates failures. Extension follows the executing entry and a zero-discovery guard rejects an empty success.
 * @evidence contracts/common.md#clear-and-simple-design One serial unit entry selects the direct feature directory and reports individual execution time; one ttsx invocation owns type checking and execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary imports consume the built e2e package. No foreign resolver, method or module export is replaced; no fixture/backend/compiler integration is introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller artifacts and the language-only startup. Per-case elapsed times, missing discovery and final elapsed time remain visible.
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
    throw new Error("No e2e-package unit function has been discovered.");
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
