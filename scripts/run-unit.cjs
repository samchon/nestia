const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Runs package-owned units, isolating editor browser and SSR module state.
 *
 * Browser libraries choose DOM-dependent behavior when first imported. Merely
 * restoring globals after a browser case does not restore that module state,
 * so the editor environments have independent lifetimes and share prepared
 * packages and the native compiler cache. Each population runs after an
 * earlier failure, and every nonzero child result contributes to failure.
 *
 * @evidence contracts/common.md#principled-implementation Each package-owned source entry runs once; editor browser initialization stays in a different process from server rendering. Discovery and zero-test guards remain with the entries, and any failed child fails the aggregate.
 * @evidence contracts/common.md#clear-and-simple-design A fixed package list and the editor's second entry express execution ownership and the required browser isolation. Each installed ttsx launcher is resolved through its workspace manifest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runner invokes each actual source entry once without retries, global loader changes or mocked results. Independent environments address verified DOM-initialization leakage instead of resetting foreign module caches.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why restoring globals is insufficient, what work is shared and how failures affect later populations.
 * @evidence contracts/portability.md#os-neutral-implementation Node executes the installed JavaScript launcher with argument arrays, native path joins, explicit cwd and windowsHide, without shell command construction or platform-specific executable shims.
 * @evidence contracts/performance.md#efficient-algorithms Each package entry runs once and failure aggregation retains only entry identities; the runner performs no work proportional to the individual test count.
 * @evidence contracts/performance.md#reuse-equivalent-work All package entries consume caller-built artifacts and the same absolute native binary/Go caches. Editor runtime module state cannot be reused across incompatible DOM initialization premises.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each synchronous child terminates before the next begins and streams output; the parent retains no child handles, output buffers or browser windows after completion.
 */
function runUnit(root = path.resolve(__dirname, ".."), selected) {
  const suites = [
    "test-transform-options",
    "test-sdk",
    "test-migrate",
    "test-benchmark",
    "test-editor",
    "test-cli",
  ];
  if (selected !== undefined && !suites.includes(selected)) {
    console.error(`Unknown unit workspace: ${selected}`);
    return 1;
  }
  const failed = [];
  for (const suite of selected === undefined ? suites : [selected]) {
    const workspace = path.join(root, "tests", suite);
    const manifestFile = require.resolve("ttsc/package.json", { paths: [workspace] });
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    const launcher = path.resolve(path.dirname(manifestFile), manifest.bin.ttsx);
    const entries = suite === "test-editor"
      ? ["src/index.ts", "src/browser/index.ts"]
      : ["src/index.ts"];
    for (const entry of entries) {
      console.log(`Unit population: ${suite}/${entry}`);
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
      if (result.error || result.signal || result.status !== 0)
        failed.push(`${suite}/${entry}`);
    }
  }
  if (failed.length) console.error(`Failed unit populations: ${failed.join(", ")}`);
  return failed.length ? 1 : 0;
}

module.exports = { runUnit };
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--workspace")) {
    console.error("Usage: node scripts/run-unit.cjs [--workspace test-xyz]");
    process.exitCode = 1;
  } else process.exitCode = runUnit(undefined, args[1]);
}
