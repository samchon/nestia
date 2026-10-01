const cp = require("node:child_process");
const path = require("node:path");

/**
 * Runs every boundary suite against the packages already built by the caller.
 *
 * A failed suite is collected without suppressing later suites. The SDK reuses
 * those package builds and checks their freshness; the measurement workspace
 * has a separate build prerequisite because it is not a published package.
 *
 * @evidence contracts/common.md#principled-implementation Each canonical start command runs once; child failures accumulate, and benchmark execution requires its own successful build. SDK generation checks the reused package builds before testing them.
 * @evidence contracts/common.md#clear-and-simple-design One ordered suite list and one launch function own execution and failure aggregation; package builds remain with root test or the CI build step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runner invokes actual workspace commands and retains every failed suite identity, without retries, mocked execution or success substitutions.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the caller-owned build prerequisite, continuation after failures and the measurement workspace's additional preparation.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches pnpm's JavaScript entrypoint from npm_execpath with an argument array and windowsHide; no platform-specific executable shim or shell string is composed.
 * @evidence contracts/performance.md#efficient-algorithms Each suite runs once in sequence, so orchestration costs the sum of its commands and retains only failed suite names.
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
  for (const suite of [
    "test-boundaries",
    "test-evidence",
    "test-benchmark",
    "test-migrate",
    "test-transform-options",
    "test-sdk",
  ])
    run(
      suite,
      ["--filter", `./tests/${suite}`, "start"],
      suite === "test-sdk" ? { TEST_SDK_SKIP_BUILD: "1" } : {},
    );
  if (run("benchmark build", ["--filter", "./benchmark", "build"]))
    run("benchmark test", ["--filter", "./benchmark", "test"]);
  if (failed.length) console.error(`Failed E2E suites: ${failed.join(", ")}`);
  return failed.length ? 1 : 0;
}

module.exports = { runE2E };
if (require.main === module) process.exitCode = runE2E();
