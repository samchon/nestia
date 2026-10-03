const assert = require("node:assert/strict");
const cp = require("node:child_process");
const path = require("node:path");

/**
 * Executes a test population plan through the pinned pnpm process boundary.
 *
 * The supplied plan owns prerequisites and population selection. This boundary
 * resolves one compiler cache, streams every child result and normalizes launch
 * failures without throwing away the plan's remaining independent work.
 *
 * @evidence contracts/common.md#principled-implementation The installed pnpm manager executes the caller plan's ordinary commands and returns actual statuses, including launch failures and signals. The plan owns prerequisite decisions and final aggregation.
 * @evidence contracts/common.md#clear-and-simple-design One native boundary records each phase's first result and timing; population plans separately own command selection and aggregation. Process failure returns status two so later independent work can continue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary pnpm commands execute the supplied population without resolver changes, success substitution or retries. The boundary inherits the caller environment and only resolves its cache location.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the split between native execution and prerequisite selection; output names every first result and elapsed time.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches the absolute installed pnpm JavaScript entry with an argument array and no shell. Native paths resolve the repository and cache once before changing workspace directories.
 * @evidence contracts/performance.md#efficient-algorithms A fixed sequence starts each canonical population once, records constant-size status and timing data, and streams child output without buffering entire logs.
 * @evidence contracts/performance.md#reuse-equivalent-work All children inherit the same absolute compiler cache and caller-selected Go executable. Population plans and suites own artifact identity, prerequisite decisions and any reuse of built package outputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous child completion releases each process before the next phase. The entry retains only scalar statuses, does not delete caller caches, and owns no background host or generated fixture lifetime.
 */
function runPnpmPlan(plan) {
  const root = path.resolve(__dirname, "..");
  const pnpm = process.env.npm_execpath;
  assert(
    pnpm && path.isAbsolute(pnpm),
    "Run tests through pnpm so the pinned installed manager owns child commands.",
  );
  const env = {
    ...process.env,
    TTSC_CACHE_DIR: path.resolve(
      root,
      process.env.TTSC_CACHE_DIR ?? "node_modules/.cache/ttsc",
    ),
  };
  // Keep the child result, including a launch error or signal, rather than
  // throwing out of the sequence before unrelated populations can execute.
  const run = (name, args, extraEnv) => {
    const started = Date.now();
    console.log(`\nTest phase: ${name}`);
    const result = cp.spawnSync(process.execPath, [pnpm, ...args], {
      cwd: root,
      env: { ...env, ...extraEnv },
      stdio: "inherit",
    });
    if (result.error) console.error(result.error);
    if (result.signal) console.error(`${name} terminated by ${result.signal}`);
    const status = Number.isInteger(result.status) ? result.status : 2;
    console.log(
      `Test phase result: ${name}; exit ${status}; ${Date.now() - started} ms`,
    );
    return status;
  };
  return plan(run);
}

/**
 * Executes the fixed test population plan through its process boundary.
 *
 * Build success permits artifact consumers; other first results remain
 * independent. The boundary supplied by runPnpmPlan owns native process
 * execution.
 *
 * @evidence contracts/common.md#principled-implementation Each canonical population executes once and contributes its result. Build status alone decides whether package artifact consumers may execute; Evidence, Go and orchestration units do not require that build.
 * @evidence contracts/common.md#clear-and-simple-design The ordered plan separates prerequisite selection and status aggregation from native command execution, so the process boundary and portable failure decisions have distinct owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied boundary receives ordinary commands and returns actual statuses; this plan does not substitute outputs, retry failed work or alter product behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the build prerequisite and boundary responsibility; blocked consumers are reported explicitly.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan selects command argument arrays and statuses; runPnpmPlan owns native executable/path/environment resolution and process launch.
 * @evidence contracts/performance.md#efficient-algorithms A constant-size ordered plan invokes each population once and aggregates scalar statuses; command execution owns the cost of each population.
 * @evidence contracts/performance.md#reuse-equivalent-work Only this plan's successful build permits caller-artifact consumers and the SDK freshness-checked skip-build flag. Test failures leave those artifacts valid for later independent consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This plan retains scalar phase statuses for one invocation and acquires no handles or background resources; the execution boundary owns its child lifetimes.
 */
function runTestPhases(run) {
  const build = run("build", ["run", "build"]);
  const evidence = run("Evidence", ["run", "evidence"]);
  const go = run("Go units", ["run", "test:go"]);
  let runner = 0;
  let units = 0;
  let workspaces = 0;
  if (build === 0) {
    units = run("JavaScript units", ["run", "test:unit"]);
    workspaces = run("test workspaces", ["run", "test:e2e"]);
  } else {
    runner = run("runner units", [
      "exec",
      "node",
      "--test",
      "scripts/test_*.cjs",
    ]);
    console.error(
      "Blocked JavaScript populations: this run's package build failed.",
    );
  }
  return Math.max(build, evidence, go, runner, units, workspaces);
}

module.exports = { runPnpmPlan, runTestPhases };
if (require.main === module) process.exitCode = runPnpmPlan(runTestPhases);
