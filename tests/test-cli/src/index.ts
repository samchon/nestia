import { DynamicExecutor } from "@nestia/e2e";
import path from "path";

/**
 * Executes discovered scaffold units serially and reports their elapsed time.
 *
 * Serial execution keeps the corepack prompt environment flag isolated while
 * its case restores the original value. A rejected unit or an empty discovery
 * fails the entry; discovery follows the running module's source extension.
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
    extension: path.extname(__filename).slice(1),
  });
  if (report.executions.length === 0)
    throw new Error("No CLI unit tests were discovered.");
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
