const cp = require("node:child_process");
const path = require("node:path");

/**
 * Runs the canonical test populations after one shared package build.
 *
 * Evidence and Go can report independently of the build. Unit and E2E consume
 * built artifacts, and one test failure must not suppress another population.
 *
 * @evidence contracts/common.md#principled-implementation The build prerequisite gates its consumers, while Evidence and each prepared test population contribute independently to the final nonzero status.
 * @evidence contracts/common.md#clear-and-simple-design One launcher owns argument delivery and failure collection; an explicit prerequisite and ordered command list express the execution dependencies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual pnpm children run each canonical command once without retries, substitute results or acceptance of an unavailable build.
 * @evidence contracts/common.md#meaningful-documentation The comment states the shared build, independent Evidence result and continuation after individual test failures.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches the caller's pnpm JavaScript entrypoint with an argument array and native path joins, without composing executable shims or shell commands.
 * @evidence contracts/performance.md#efficient-algorithms The fixed population runs once in sequence and retains only failed command names; orchestration adds no work proportional to fixture size.
 * @evidence contracts/performance.md#reuse-equivalent-work A single package build prepares every test population, and all children receive the same absolute native compiler and Go cache directories.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each synchronous child settles before the next command starts and streams its output; no child handles or captured output survive in the runner.
 */
function runTests(
  root = path.resolve(__dirname, ".."),
  launcher = process.env.npm_execpath,
) {
  if (!launcher) {
    console.error("Run this entry through pnpm test.");
    return 1;
  }
  const failed = [];
  const run = (name) => {
    console.log(`Test population: ${name}`);
    const result = cp.spawnSync(process.execPath, [launcher, name], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        TTSC_GO_BINARY: process.env.TTSC_GO_BINARY || "go",
        TTSC_CACHE_DIR: path.join(root, "node_modules/.cache/ttsc"),
        GOCACHE: path.join(root, "node_modules/.cache/ttsc/go-build"),
      },
    });
    if (result.error) console.error(result.error);
    if (result.error || result.signal || result.status !== 0) {
      failed.push(name);
      return false;
    }
    return true;
  };
  const built = run("build");
  run("evidence");
  run("test:go");
  if (built) for (const name of ["test:unit", "test:e2e"]) run(name);
  if (failed.length)
    console.error(`Failed test populations: ${failed.join(", ")}`);
  return failed.length ? 1 : 0;
}

module.exports = { runTests };
if (require.main === module) process.exitCode = runTests();
