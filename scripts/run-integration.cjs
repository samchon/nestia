const { runPnpmPlan } = require("./run-tests.cjs");

/**
 * Runs SDK and migration integration connections against caller-built
 * artifacts.
 *
 * Direct workspace units have their own population. The installed pnpm runner
 * continues independent integration owners after a failure; compiler,
 * generated-consumer and runtime preparation remain inside those owners.
 *
 * @evidence contracts/common.md#principled-implementation The ordinary SDK and migration integration scripts execute once through pnpm's no-bail recursive runner. Their actual final status is returned; caller-built artifacts are required and SDK verifies their freshness before skipping its build.
 * @evidence contracts/common.md#clear-and-simple-design One canonical integration plan selects the two populated owners and delegates native execution and absolute cache resolution to runPnpmPlan. Units and package builds remain separate populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This plan calls existing public integration connections without retry, resolver replacement, copied results or additional compiler contexts. Suite owners retain their first failures.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the caller-built prerequisite, independent-owner continuation and the suites' shared preparation responsibility.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan supplies a pnpm argument array and environment setting; runPnpmPlan owns native executable, path, cache and process boundaries.
 * @evidence contracts/performance.md#efficient-algorithms One fixed boundary call starts the participating owners once and retains only its scalar result. Suite owners count and consolidate their actual installation, compiler and runtime operations.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-built artifacts and one absolute compiler cache reach both integration owners. SDK's existing freshness check validates skip-build before consuming artifacts; different generation and transport semantics retain their suite-owned distinctions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This plan retains no handles or fixture state. The synchronous native boundary settles the recursive runner, while each suite owns partial-startup and runtime cleanup.
 */
function runIntegrationPhases(run) {
  return run(
    "SDK and migration integrations",
    [
      "--filter=./tests/test-sdk",
      "--filter=./tests/test-migrate",
      "-r",
      "--no-bail",
      "run",
      "start",
    ],
    { TEST_SDK_SKIP_BUILD: "1" },
  );
}

module.exports = { runIntegrationPhases };
if (require.main === module)
  process.exitCode = runPnpmPlan(runIntegrationPhases);
