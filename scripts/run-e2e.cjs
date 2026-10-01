const cp = require("node:child_process");
const path = require("node:path");

/**
 * Runs the sole integrated E2E entry against caller-built package artifacts.
 *
 * The entry owns its shared packed installation, compiler phases and connected
 * consumers. This launcher adds no installation, product build or old-suite
 * dispatch; a preparation, runtime or process failure remains nonzero.
 *
 * @evidence contracts/common.md#principled-implementation The canonical test-e2e start owns every connected assertion and shared preparation; this launcher returns its actual child outcome, including launch failures and signals.
 * @evidence contracts/common.md#clear-and-simple-design One fixed workspace start and one synchronous child express the single E2E execution boundary without a parallel group or per-feature dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual integrated entry runs once without retries, mocked execution, obsolete workspace starts or success substitution.
 * @evidence contracts/common.md#meaningful-documentation The comment states caller-built prerequisites, entry-owned shared preparation and propagation of child failures.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches pnpm's JavaScript entrypoint with argument arrays, explicit cwd, native paths and windowsHide; no shell command or executable shim is constructed.
 * @evidence contracts/performance.md#efficient-algorithms The launcher executes one child and retains only its result; it performs no loop over independent fixture compiler programs.
 * @evidence contracts/performance.md#reuse-equivalent-work The entry receives the caller-built package artifacts and shared absolute compiler/Go caches; preparation is owned once by the integrated entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous child settles and streams output directly; the launcher owns no persistent handles, buffers or additional backend lifetime.
 */
function runE2E(
  root = path.resolve(__dirname, ".."),
  launcher = process.env.npm_execpath,
) {
  if (!launcher) {
    console.error("Run this entry through pnpm test:e2e.");
    return 1;
  }
  console.log("E2E population: test-e2e");
  const result = cp.spawnSync(
    process.execPath,
    [launcher, "--filter", "./tests/test-e2e", "start"],
    {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        TTSC_CACHE_DIR: path.join(root, "node_modules/.cache/ttsc"),
        GOCACHE: path.join(root, "node_modules/.cache/ttsc/go-build"),
      },
    },
  );
  if (result.error) console.error(result.error);
  return result.error || result.signal || result.status !== 0 ? 1 : 0;
}

module.exports = { runE2E };
if (require.main === module) process.exitCode = runE2E();
