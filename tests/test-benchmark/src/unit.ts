import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Runs benchmark report, statistics and pre-worker validation units against
 * caller-built package artifacts.
 *
 * @evidence contracts/common.md#principled-implementation The built executor discovers matching exports in the dedicated unit directory, awaits assertions and rejects empty discovery. Each case calls its actual built owner with authored inputs.
 * @evidence contracts/common.md#clear-and-simple-design One entry selects only direct units and reports their outcomes; actual application and worker connections run in the shared SDK integration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary imports consume built artifacts. No resolver, module export, compiler or runtime method is replaced, and the entry supplies no expected result.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller artifacts, unit population and shared SDK integration ownership. The executor reports per-case failure identity and total execution time.
 */
export async function runBenchmarkUnits(): Promise<void> {
  const report = await DynamicExecutor.assert({
    parameters: () => [],
    location: __dirname + "/features/unit",
    prefix: "test",
    extension: __filename.substring(__filename.lastIndexOf(".") + 1),
    simultaneous: 1,
    onComplete: (execution) =>
      console.log(
        ` - ${execution.name}: ${execution.error ? "failed" : "passed"}`,
      ),
  });
  if (report.executions.length === 0)
    throw new Error("No benchmark units have been discovered.");
  console.log(
    `Benchmark units: ${report.executions.length}; ${report.time} ms`,
  );
}

if (require.main === module || process.argv[1] === __filename)
  runBenchmarkUnits().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
