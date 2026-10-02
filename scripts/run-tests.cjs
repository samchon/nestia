const assert = require("node:assert/strict");
const cp = require("node:child_process");
const path = require("node:path");

/**
 * Builds caller artifacts once and retains every independent test result.
 *
 * Native units and declaration checks can run after a failed build. JavaScript
 * populations require its artifacts and are explicitly blocked in that state;
 * an earlier test failure never blocks a later independent population.
 *
 * @evidence contracts/common.md#principled-implementation The installed pnpm manager runs the canonical build, Evidence, Go, package units and test-workspace commands. Each process result contributes to the final exit code; only the artifact prerequisite suppresses JavaScript populations.
 * @evidence contracts/common.md#clear-and-simple-design One entry records each phase's first result and timing, with one build prerequisite and a final maximum nonzero status. Process failure does not short circuit independent phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary pnpm commands execute actual workspaces without resolver changes, status substitution or retries. Skip-build reaches SDK only after the same run's successful build.
 * @evidence contracts/common.md#meaningful-documentation The comment states prerequisites and continued execution; phase output distinguishes failed, blocked and completed work.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches the absolute installed pnpm JavaScript entry with an argument array and no shell. Native paths resolve the repository and cache once before changing workspace directories.
 * @evidence contracts/performance.md#efficient-algorithms A fixed sequence starts each canonical population once, records constant-size status and timing data, and streams child output without buffering entire logs.
 * @evidence contracts/performance.md#reuse-equivalent-work Successful package artifacts belong to this run and serve package units and workspace starts; SDK receives the existing freshness-checked skip-build contract. All children inherit the same absolute compiler cache and any caller-selected Go executable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous child completion releases each process before the next phase. The entry retains only scalar statuses, does not delete caller caches, and owns no background host or generated fixture lifetime.
 */
function runTests() {
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
  return runTestPhases(run);
}

/**
 * Executes the fixed test population plan through its process boundary.
 *
 * Build success permits artifact consumers; other first results remain
 * independent. The boundary supplied by runTests owns native process
 * execution.
 *
 * @evidence contracts/common.md#principled-implementation Each canonical population executes once and contributes its result. Build status alone decides whether package artifact consumers may execute; Evidence, Go and orchestration units do not require that build.
 * @evidence contracts/common.md#clear-and-simple-design The ordered plan separates prerequisite selection and status aggregation from native command execution, so the process boundary and portable failure decisions have distinct owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied boundary receives ordinary commands and returns actual statuses; this plan does not substitute outputs, retry failed work or alter product behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the build prerequisite and boundary responsibility; blocked consumers are reported explicitly.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan selects command argument arrays and statuses; runTests owns native executable/path/environment resolution and process launch.
 * @evidence contracts/performance.md#efficient-algorithms A constant-size ordered plan invokes each population once and aggregates scalar statuses; command execution owns the cost of each population.
 * @evidence contracts/performance.md#reuse-equivalent-work Only this plan's successful build permits caller-artifact consumers and the SDK freshness-checked skip-build flag. Test failures leave those artifacts valid for later independent consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This plan retains scalar phase statuses for one invocation and acquires no handles or background resources; the execution boundary owns its child lifetimes.
 */
function runTestPhases(run) {
  const build = run("build", ["run", "build"]);
  const evidence = run("Evidence", ["run", "evidence"]);
  const go = run("Go units", [
    "--filter=./packages/*",
    "-r",
    "--no-bail",
    "--if-present",
    "run",
    "test:go",
  ]);
  const runner = run("runner units", [
    "exec",
    "node",
    "--test",
    "scripts/test_run_test_phases.cjs",
  ]);
  let units = 0;
  let workspaces = 0;
  if (build === 0) {
    units = run("package JavaScript units", [
      "--filter=./packages/*",
      "-r",
      "--no-bail",
      "--if-present",
      "run",
      "test:unit",
    ]);
    workspaces = run(
      "test workspaces",
      ["--filter=./tests/*", "-r", "--no-bail", "run", "start"],
      { TEST_SDK_SKIP_BUILD: "1" },
    );
  } else
    console.error(
      "Blocked JavaScript populations: this run's package build failed.",
    );
  return Math.max(build, evidence, go, runner, units, workspaces);
}

module.exports = { runTests, runTestPhases };
if (require.main === module) process.exitCode = runTests();
