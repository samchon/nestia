import { DynamicExecutor } from "../../../../packages/e2e/lib";

/**
 * Discovers browser editor units in their isolated DOM process.
 *
 * Cases initialize browser globals before loading built UI modules and restore
 * their state. A separate process preserves the SSR initialization contract.
 * Standalone execution owns its artifact graph; a parent-supplied graph remains
 * valid until this process settles.
 *
 * @evidence contracts/common.md#principled-implementation Built DynamicExecutor serially executes every matching browser unit and rejects assertion failures or empty discovery. Each unit loads caller-built UI operations after authoring its DOM input.
 * @evidence contracts/common.md#clear-and-simple-design This entry owns browser discovery and reporting; the case owns DOM lifetime and assertions, while the native runner keeps SSR and browser processes separate. Standalone artifact preparation has finally cleanup; parent-supplied artifacts remain under the parent's lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary executor and built UI imports execute actual operations without product compilation, altered outputs or resolver changes.
 * @evidence contracts/common.md#meaningful-documentation The comment explains DOM-before-module initialization, restoration and the reason for process isolation.
 */
export async function main(): Promise<void> {
  const {
    prepareUnitArtifacts,
  } = require("../../../../scripts/UnitArtifacts.cjs");
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
      throw new Error("No editor browser test function has been discovered.");
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
