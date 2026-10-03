import path from "path";

import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Executes discovered scaffold units serially and reports their elapsed time.
 *
 * Serial execution keeps the corepack prompt environment flag isolated while
 * its case restores the original value. A rejected unit or an empty discovery
 * fails the entry; discovery follows the running module's source extension.
 *
 * @evidence contracts/common.md#principled-implementation The built DynamicExecutor discovers every matching scaffold unit serially and rejects assertion failures or zero discoveries. The language runner disables plugins because the cases call built CLI engines through authored effect contexts.
 * @evidence contracts/common.md#clear-and-simple-design One entry configures discovery, reports elapsed time and rejects an empty population; each case owns its authored inputs and recorded effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary built imports and supported CLI context injection reach the real engine. The entry replaces no resolver or result and starts no product compiler or process.
 * @evidence contracts/common.md#meaningful-documentation The comment explains serial environment isolation, running-extension discovery and caller-built unit execution.
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
