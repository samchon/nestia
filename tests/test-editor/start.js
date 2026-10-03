const assert = require("node:assert/strict");
const cp = require("node:child_process");
const { prepareUnitArtifacts } = require("../../scripts/UnitArtifacts.cjs");

/**
 * Runs SSR and browser units in isolated processes, retaining both results.
 *
 * Browser initialization changes DOM-dependent module state and therefore owns
 * a separate process. An SSR assertion failure must not suppress that
 * independent population. Both commands load caller-built artifacts with
 * plugins off. One ordinary artifact graph serves both processes and is
 * released after they settle, including failure.
 *
 * @evidence contracts/common.md#principled-implementation The pinned installed pnpm JavaScript entry executes both canonical unit commands independently; their actual exit statuses determine the aggregate result, including launch or signal failures.
 * @evidence contracts/common.md#clear-and-simple-design A fixed two-command plan separates failure decisions from native launches. The artifact operation owns ordinary dependency graph assembly, the runner owns its shared lifetime, and TypeScript entries own discovery and assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary process execution invokes both original test populations without retries, resolver replacement, substituted outcomes or skipped assertions.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why browser initialization is isolated and why a failed SSR population cannot block browser units.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches the absolute installed pnpm JavaScript path with an argument array and no shell; cwd is the native workspace directory and child environment is inherited.
 * @evidence contracts/performance.md#efficient-algorithms A fixed two-process sequence streams output and retains only statuses; each discovery population executes once.
 * @evidence contracts/performance.md#reuse-equivalent-work Both populations use one unchanged caller-built editor/migrate graph with ordinary published resolution fields. Plugins are disabled for entry preparation and built dependency resolution prevents workspace-source re-entry; separate processes preserve DOM-dependent initialization premises.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each synchronous child settles before the next begins. Browser units own DOM/root cleanup; the runner disposes its unique copied artifact view in finally after both children and never removes installed external dependencies.
 */
function runEditorUnits() {
  assert(
    process.env.npm_execpath &&
      require("node:path").isAbsolute(process.env.npm_execpath),
    "Run editor units through pnpm.",
  );
  const artifacts = prepareUnitArtifacts(["@nestia/editor"]);
  try {
    return runEditorUnitPhases((command) => {
      const result = cp.spawnSync(
        process.execPath,
        [process.env.npm_execpath, "run", command],
        {
          cwd: __dirname,
          stdio: "inherit",
          env: { ...process.env, NESTIA_UNIT_ARTIFACT_ROOT: artifacts.root },
        },
      );
      if (result.error) console.error(result.error);
      if (result.signal)
        console.error(`${command} terminated by ${result.signal}`);
      return Number.isInteger(result.status) ? result.status : 2;
    });
  } finally {
    artifacts.dispose();
  }
}

/**
 * Executes both independent editor populations through the caller's boundary.
 *
 * The first failure must not suppress the other process. Native launch and
 * signal normalization remain with runEditorUnits.
 *
 * @evidence contracts/common.md#principled-implementation Both commands execute before status aggregation, preserving the maximum first-result status regardless of which population fails.
 * @evidence contracts/common.md#clear-and-simple-design One two-command plan exposes the independent execution decision separately from the native process boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan forwards both canonical commands and retains their returned results without retries or substituted output.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies failure independence and the separate native launch owner.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This operation selects command names and aggregates numeric statuses; runEditorUnits owns native path and process behavior.
 * @evidence contracts/performance.md#efficient-algorithms Two boundary calls and one maximum computation use constant space and no additional discovery.
 * @evidence contracts/performance.md#reuse-equivalent-work The plan executes each population once; artifact sharing and browser isolation belong to its native caller and test entries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two scalar statuses survive the synchronous boundary calls; no resource is acquired by this plan.
 */
function runEditorUnitPhases(run) {
  const ssr = run("test:unit:ssr");
  const browser = run("test:unit:browser");
  return Math.max(ssr, browser);
}

module.exports = { runEditorUnits, runEditorUnitPhases };
if (require.main === module) process.exitCode = runEditorUnits();
