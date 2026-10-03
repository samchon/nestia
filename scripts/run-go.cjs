const { runPnpmPlan } = require("./run-tests.cjs");

/**
 * Runs the two native unit owners through the canonical test environment.
 *
 * A direct pnpm Go alias bypassed the root compiler-cache environment. The
 * shared native boundary now supplies default Go object-cache alignment even
 * when this population is invoked independently of pnpm test.
 *
 * @evidence contracts/common.md#principled-implementation The two actual owning package scripts run through pnpm with no-bail and their existing count=1 options. The shared boundary supplies the resolved environment and returns the first actual population result.
 * @evidence contracts/common.md#clear-and-simple-design One fixed population plan selects core and SDK test modules. Environment resolution and native process execution remain in runPnpmPlan rather than a second shell wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary package Go scripts execute their in-process units without retries, cached-pass substitution, product fixtures or a dedicated compiler host.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the independently invoked command's former cache bypass and the shared environment owner.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This operation selects argument arrays; runPnpmPlan owns native paths, Go environment inheritance and process launching.
 * @evidence contracts/performance.md#efficient-algorithms One fixed boundary call invokes the two package owners once and retains a scalar result. Tests retain their count=1 runtime semantics.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical native units inherit the same default Go object cache as source-plugin builds, with explicit caller overrides retained and Go's own toolchain/input invalidation unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This plan creates no cache directories or process handles itself. The native boundary settles its child and Go owns its object-cache files; caller caches are never removed.
 */
function runGoPhases(run) {
  return run("native Go units", [
    "--filter=@nestia/core",
    "--filter=@nestia/sdk",
    "-r",
    "--no-bail",
    "run",
    "test:go",
  ]);
}

module.exports = { runGoPhases };
if (require.main === module) process.exitCode = runPnpmPlan(runGoPhases);
