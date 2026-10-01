const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Runs utility/SSR and browser-component units in independent Node processes.
 *
 * Browser libraries choose DOM-dependent behavior when first imported. Merely
 * restoring globals after a browser case does not restore that module state,
 * so the two environments have independent lifetimes and share prepared
 * packages and the native compiler cache. Each population runs after an
 * earlier failure, and every nonzero child result contributes to failure.
 *
 * @evidence contracts/common.md#principled-implementation Distinct Node processes isolate browser-dependent module initialization from utility and server rendering cases. Actual source entries retain their own discovery and zero-test guards; status aggregation succeeds only when both children succeed.
 * @evidence contracts/common.md#clear-and-simple-design One fixed entry list and one synchronous launch loop express the two required runtime environments; the installed ttsx launcher is resolved through its package manifest rather than duplicated compiler logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runner invokes each actual source entry once without retries, global loader changes or mocked results. Independent environments address verified DOM-initialization leakage instead of resetting foreign module caches.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why restoring globals is insufficient, what work is shared and how failures affect later populations.
 * @evidence contracts/portability.md#os-neutral-implementation Node executes the installed JavaScript launcher with argument arrays, native path joins, explicit cwd and windowsHide, without shell command construction or platform-specific executable shims.
 * @evidence contracts/performance.md#efficient-algorithms Two entries run once and failure aggregation retains only their names; the runner performs no work proportional to the individual test count.
 * @evidence contracts/performance.md#reuse-equivalent-work Both environments consume caller-built package artifacts and the same absolute native binary/Go caches. Runtime module state cannot be reused across their incompatible DOM initialization premises.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each synchronous child terminates before the next begins and streams output; the parent retains no child handles, output buffers or browser windows after completion.
 */
function runUnit(root = path.resolve(__dirname, "..")) {
  const workspace = path.join(root, "tests/test-unit");
  const manifestFile = require.resolve("ttsc/package.json", {paths: [workspace]});
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const launcher = path.resolve(path.dirname(manifestFile), manifest.bin.ttsx);
  const failed = [];
  for (const entry of ["src/index.ts", "src/browser/index.ts"]) {
    console.log(`Unit population: ${entry}`);
    const result = cp.spawnSync(process.execPath, [launcher, entry], {
      cwd: workspace,
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
    if (result.error || result.signal || result.status !== 0) failed.push(entry);
  }
  if (failed.length) console.error(`Failed unit populations: ${failed.join(", ")}`);
  return failed.length ? 1 : 0;
}

module.exports = {runUnit};
if (require.main === module) process.exitCode = runUnit();
