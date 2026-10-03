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
export async function runSharedIntegrations<T>(
  prepare: () => Promise<T>,
  owners: ReadonlyArray<readonly [string, (consumer: T) => Promise<void>]>,
): Promise<number> {
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
      console.log(
        `Integration owner result: ${name}; exit 0; ${Date.now() - started} ms`,
      );
    } catch (error) {
      status = 1;
      console.error(
        `Integration owner result: ${name}; exit 1; ${Date.now() - started} ms`,
        error,
      );
    }
  }
  return status;
}

if (require.main === module || process.argv[1] === __filename) {
  const { main: migrate } = require("../../../test-migrate/src/index");

  const { main: sdk } = require("./SdkRunner");
  const {
    preparePublicConsumer,
  } = require("../../../../config/testing/PublicConsumer.ts");

  runSharedIntegrations(
    () => preparePublicConsumer(["tests/test-sdk", "tests/test-migrate"]),
    [
      ["SDK", sdk],
      ["migration", migrate],
    ],
  )
    .then((status: number) => {
      process.exitCode = status;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
