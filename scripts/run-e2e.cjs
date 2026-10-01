const cp = require("node:child_process");
const path = require("node:path");

/**
 * Runs every boundary suite against the packages already built by the caller.
 *
 * Five independent preparation suites run together, then SDK runs after every
 * member settles so its full population does not overlap other native work.
 * Child command failures are collected without suppressing later suites, and
 * pnpm streams each parallel member's result. The SDK reuses
 * those package builds and checks their freshness; the measurement workspace
 * has a separate build prerequisite because it is not a published package.
 *
 * @evidence contracts/common.md#principled-implementation Each canonical start command runs once; child failures accumulate, and benchmark execution requires its own successful build. SDK generation checks the reused package builds before testing them.
 * @evidence contracts/common.md#clear-and-simple-design One parallel preparation group, the exclusive SDK command and one synchronous launch function own execution and failure aggregation; pnpm owns the group's child concurrency and package builds remain with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual workspace commands run without retries, mocked execution or success substitutions. Failed command identities are retained, and pnpm streams component-level failures from its parallel group instead of representing every group member as failed.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the caller-owned build prerequisite, continuation after failures and the measurement workspace's additional preparation.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches pnpm's JavaScript entrypoint from npm_execpath with an argument array and windowsHide; no platform-specific executable shim or shell string is composed.
 * @evidence contracts/performance.md#efficient-algorithms Every suite runs once; boundaries, Evidence process checks, benchmark requests, migration and options overlap through pnpm's parallel dispatcher without early bail. SDK starts only after that group finishes. Orchestration retains only failed command names and performs no work proportional to fixture size.
 * @evidence contracts/performance.md#reuse-equivalent-work All suites consume the same caller-built package artifacts; TEST_SDK_SKIP_BUILD reuses them only after the SDK harness's freshness check, and one absolute native cache is shared by every child.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each synchronous launch settles before the next starts and streams output directly; the runner retains no child handles, reports or background processes.
 */
function runE2E(
  root = path.resolve(__dirname, ".."),
  launcher = process.env.npm_execpath,
) {
  if (!launcher) {
    console.error("Run this entry through pnpm test:e2e.");
    return 1;
  }
  const failed = [];
  const run = (name, args, extraEnv = {}) => {
    console.log(`E2E suite: ${name}`);
    const result = cp.spawnSync(process.execPath, [launcher, ...args], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        TTSC_CACHE_DIR: path.join(root, "node_modules/.cache/ttsc"),
        GOCACHE: path.join(root, "node_modules/.cache/ttsc/go-build"),
        ...extraEnv,
      },
    });
    if (result.error) console.error(result.error);
    if (result.error || result.signal || result.status !== 0) {
      failed.push(name);
      return false;
    }
    return true;
  };
  run("test-boundaries, test-evidence, test-benchmark-e2e, test-migrate-e2e, test-core-e2e", [
    "--filter", "./tests/test-boundaries",
    "--filter", "./tests/test-evidence",
    "--filter", "./tests/test-benchmark-e2e",
    "--filter", "./tests/test-migrate-e2e",
    "--filter", "./tests/test-core-e2e",
    "-r", "--parallel", "--no-bail", "run", "start",
  ]);
  run("test-sdk-e2e", ["--filter", "./tests/test-sdk-e2e", "start"], {
    TEST_SDK_SKIP_BUILD: "1",
  });
  if (run("benchmark build", ["--filter", "./benchmark", "build"]))
    run("benchmark test", ["--filter", "./benchmark", "test"]);
  if (failed.length) console.error(`Failed E2E commands: ${failed.join(", ")}`);
  return failed.length ? 1 : 0;
}

module.exports = { runE2E };
if (require.main === module) process.exitCode = runE2E();
