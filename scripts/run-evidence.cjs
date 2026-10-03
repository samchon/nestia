const { runPnpmPlan } = require("./run-tests.cjs");

/**
 * Checks every maintained Evidence population without masking later results.
 *
 * Package recursion omitted root orchestration and direct workspace units.
 * These independent source checks need no package build and must all execute
 * even when an earlier population rejects an acknowledgment.
 *
 * @evidence contracts/common.md#principled-implementation Root, published package and direct workspace unit declarations each receive their actual configured Evidence command. Every first status participates in the final result, with no build prerequisite or failure short circuit.
 * @evidence contracts/common.md#clear-and-simple-design One ordered plan selects three source populations; the shared runPnpmPlan boundary owns native launching and cache/path resolution. This function retains only their scalar statuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual Evidence commands evaluate their maintained configurations once. The plan substitutes no report, lowers no severity and never retries or ignores a rejected population.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the formerly omitted owners and their independent source-check semantics; each population receives a distinct phase name.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan selects argument arrays only. The shared runPnpmPlan boundary owns executable, path and environment resolution on each platform.
 * @evidence contracts/performance.md#efficient-algorithms A constant three-step plan evaluates each declared population once and aggregates scalar statuses. Package recursion checks all owning packages in one pinned-manager invocation.
 * @evidence contracts/performance.md#reuse-equivalent-work All populations consume the same unchanged source/contract snapshot and shared native execution boundary; no source compilation, installation or artifact build is requested by the plan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The plan holds three statuses for one invocation and creates no files or handles. The shared execution boundary completes each child before returning its first result.
 */
function runEvidencePhases(run) {
  const root = run("root Evidence", [
    "exec",
    "evidence",
    "--config",
    "evidence.config.json",
  ]);
  const packages = run("package Evidence", [
    "--filter=./packages/*",
    "--fail-if-no-match",
    "-r",
    "--no-bail",
    "--workspace-concurrency=1",
    "run",
    "evidence",
  ]);
  const units = run("workspace unit Evidence", [
    "exec",
    "evidence",
    "--config",
    "tests/evidence.config.json",
  ]);
  return Math.max(root, packages, units);
}

module.exports = { runEvidencePhases };
if (require.main === module) process.exitCode = runPnpmPlan(runEvidencePhases);
