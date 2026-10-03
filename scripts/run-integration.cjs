const { runPnpmPlan } = require("./run-tests.cjs");

/**
 * Runs SDK and migration integration connections against caller-built
 * artifacts.
 *
 * One test-language entry shares a freshly validated public installation.
 * SDK retains its plain-Node runtime child; migration retains its real CLI.
 * Their first failures remain independent after the shared prerequisite.
 *
 * @evidence contracts/common.md#principled-implementation The shared entry executes the SDK and migration owners once against one actual validated public installation. Its actual final status is returned; SDK still verifies caller-built artifact freshness before skipping its build.
 * @evidence contracts/common.md#clear-and-simple-design One canonical integration plan invokes the shared test-language entry and delegates native execution and absolute cache resolution to runPnpmPlan. Units and package builds remain separate populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This plan calls existing public integration connections without retry, resolver replacement, copied results or additional compiler contexts. Suite owners retain their first failures.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the caller-built prerequisite, independent-owner continuation and the suites' shared preparation responsibility.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This plan supplies a pnpm argument array and environment setting; runPnpmPlan owns native executable, path, cache and process boundaries.
 * @evidence contracts/performance.md#efficient-algorithms One fixed boundary call starts the participating owners once and retains only its scalar result. Suite owners count and consolidate their actual installation, compiler and runtime operations.
 * @evidence contracts/performance.md#reuse-equivalent-work One fresh public installation and absolute compiler cache reach both integration owners. SDK's existing freshness check validates skip-build; different generation and transport semantics retain their suite-owned distinctions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This plan retains no handles or fixture state. The synchronous native boundary settles the shared entry, while each suite owns partial-startup and runtime cleanup.
 */
function runIntegrationPhases(run) {
  return run(
    "SDK and migration integrations",
    [
      "exec",
      "cross-env",
      "NODE_OPTIONS=--no-experimental-strip-types --no-experimental-detect-module",
      "ttsx",
      "--no-plugins",
      "--tsconfig",
      "tests/test-migrate/tsconfig.json",
      "tests/integration.ts",
    ],
    { TEST_SDK_SKIP_BUILD: "1" },
  );
}

/**
 * Executes independent integration owners after one shared preparation.
 *
 * Preparation failure blocks both consumers. An owner failure leaves the same
 * valid installed graph available to later owners and contributes exit one.
 * Owners release their own hosts before settling; outputs remain diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Awaited preparation establishes the shared artifact prerequisite. Every owner receives that same result exactly once; exceptions contribute failure without suppressing independent subsequent owners. A failed prerequisite executes no consumer.
 * @evidence contracts/common.md#clear-and-simple-design Preparation and ordered owner calls expose separate failure boundaries, with one scalar aggregate and visible owner diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller-supplied boundaries execute actual preparation and owners. No result is retried, replaced or converted to success after failure.
 * @evidence contracts/common.md#meaningful-documentation The comment explains prerequisite failure, independent continuation and suite-owned host cleanup; output identifies each first failure and elapsed time.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This orchestration passes an opaque prepared context and acquires no native filesystem or process boundary itself.
 * @evidence contracts/performance.md#efficient-algorithms One preparation and one ordered pass over owners retain a scalar status and one context, without buffering diagnostics.
 * @evidence contracts/performance.md#reuse-equivalent-work All owners consume the same awaited artifact graph within one invocation. Preparation establishes compatible frozen dependencies and current packed bytes; no persistent success marker is consulted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sequential awaited owners settle their hosts and children before the next starts. The context is retained only for this invocation; suite owners retain ignored diagnostic output.
 */
async function runSharedIntegrations(prepare, owners) {
  let consumer;
  try {
    consumer = await prepare();
  } catch (error) {
    console.error("Shared integration preparation failed:", error);
    return 1;
  }
  let status = 0;
  for (const [name, run] of owners) {
    const started = Date.now();
    console.log(`Integration owner: ${name}`);
    try {
      await run(consumer);
      console.log(`Integration owner result: ${name}; exit 0; ${Date.now() - started} ms`);
    } catch (error) {
      status = 1;
      console.error(`Integration owner result: ${name}; exit 1; ${Date.now() - started} ms`, error);
    }
  }
  return status;
}

module.exports = { runIntegrationPhases, runSharedIntegrations };
if (require.main === module)
  process.exitCode = runPnpmPlan(runIntegrationPhases);
