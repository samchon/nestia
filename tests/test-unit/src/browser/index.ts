import { DynamicExecutor } from "@nestia/e2e";

/** Executes browser-component units in their isolated process environment. */
async function main(): Promise<void> {
  const report: DynamicExecutor.IReport = await DynamicExecutor.assert({
    parameters: () => [],
    location: __dirname + "/features",
    prefix: "test",
    onComplete: (execution) => {
      const elapsed =
        new Date(execution.completed_at).getTime() -
        new Date(execution.started_at).getTime();
      console.log(` - ${execution.name}: ${elapsed.toLocaleString()} ms`);
    },
    simultaneous: 1,
    extension: __filename.substring(__filename.length - 2),
  });
  if (report.executions.length === 0)
    throw new Error("No browser unit test function has been discovered.");
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
