const { runPnpmPlan } = require("./run-tests.cjs");

/**
 * Runs orchestration and caller-built JavaScript units independently.
 *
 * Workspace scripts select direct units only. Editor's unit script owns both
 * isolated browser and SSR processes and their shared built artifact view. The
 * caller must build packages before invoking this population.
 *
 * @evidence contracts/common.md#principled-implementation Each registered unit population contributes its first result; a runner or package failure cannot prevent independent workspace assertions.
 * @evidence contracts/common.md#clear-and-simple-design Three ordinary commands separate root orchestration, package units and workspace units. Native launching is shared with runPnpmPlan rather than duplicated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan invokes canonical unit scripts with no consumer installation, product compilation, host startup, resolver replacement or retries.
 * @evidence contracts/common.md#meaningful-documentation The comment states the caller-built prerequisite and editor isolation ownership, while the native boundary reports each phase result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan supplies argument arrays and aggregates statuses; runPnpmPlan owns native paths, process launching and environment inheritance.
 * @evidence contracts/performance.md#efficient-algorithms Three boundary calls retain scalar statuses; pnpm discovers participating scripts and continues workspaces after failures.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-built artifacts serve every unit without rebuilding packages. Each unit population executes once; editor owns one shared artifact graph across its two processes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The plan acquires no process or filesystem resources; synchronous launching and suite cleanup retain their existing owners.
 */
function runUnitPhases(run) {
  const runner = run("runner units", [
    "exec",
    "node",
    "--test",
    "scripts/test_*.cjs",
  ]);
  const packages = run("package JavaScript units", [
    "--filter=./packages/*",
    "-r",
    "--no-bail",
    "--if-present",
    "run",
    "test:unit",
  ]);
  const workspaces = run("workspace JavaScript units", [
    "--filter=./tests/*",
    "-r",
    "--no-bail",
    "--if-present",
    "run",
    "test:unit",
  ]);
  return Math.max(runner, packages, workspaces);
}

module.exports = { runUnitPhases };
if (require.main === module) process.exitCode = runPnpmPlan(runUnitPhases);
