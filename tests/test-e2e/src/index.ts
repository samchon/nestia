import { DynamicExecutor } from "@nestia/e2e";

async function main(): Promise<void> {
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
