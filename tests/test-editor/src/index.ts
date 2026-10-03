import { DynamicExecutor } from "../../../packages/e2e/lib";

/**
 * Discovers editor SSR units against caller-built artifacts.
 *
 * Browser initialization belongs to a separate process so DOM-dependent module
 * state cannot change SSR premises. The entry rejects an empty discovery.
 * Standalone execution owns a fresh caller-built artifact graph; a parent unit
 * runner can supply the same graph to both isolated populations.
 *
 * @evidence contracts/common.md#principled-implementation Built DynamicExecutor discovers and awaits every matching SSR case serially, rejecting assertion failures and zero discoveries. Plugins are unnecessary because cases load built editor operations directly.
 * @evidence contracts/common.md#clear-and-simple-design This entry owns SSR discovery and reporting; cases own authored documents and output assertions, and the native unit runner owns browser process isolation. Standalone invocation prepares and finally disposes its artifact graph; a parent-supplied graph remains owned by that parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary built imports reach the executor and actual editor operations without resolver patches, expected-output substitution or product compilation.
 * @evidence contracts/common.md#meaningful-documentation The comment states SSR premises, caller-built artifacts and the zero-discovery guard.
 */
export async function main(): Promise<void> {
  const {
    prepareUnitArtifacts,
  } = require("../../../config/testing/UnitArtifacts.ts");
  const owned = process.env.NESTIA_UNIT_ARTIFACT_ROOT
    ? undefined
    : prepareUnitArtifacts(["@nestia/editor"]);
  if (owned) process.env.NESTIA_UNIT_ARTIFACT_ROOT = owned.root;
  try {
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
      extension: __filename.substring(__filename.lastIndexOf(".") + 1),
    });
    if (report.executions.length === 0)
      throw new Error("No editor test function has been discovered.");
    console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
  } finally {
    if (owned) {
      delete process.env.NESTIA_UNIT_ARTIFACT_ROOT;
      owned.dispose();
    }
  }
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
