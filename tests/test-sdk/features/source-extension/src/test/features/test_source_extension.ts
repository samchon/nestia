import api from "@api";

/**
 * Verifies source-file SDK generation includes `.mts` and `.cts` controller
 * modules.
 *
 * The source-input generator compiles controllers to a temporary runtime
 * directory before reading reflected route metadata. TypeScript emits `.mts` as
 * `.mjs` and `.cts` as `.cjs`; the loader must follow those emitted names
 * instead of assuming every source becomes `.js`.
 *
 * 1. Generate the SDK from controllers stored in `.mts` and `.cts` files.
 * 2. Touch both generated SDK accessors and assert each path is preserved.
 * 3. Call both routes through the generated SDK to prove the dynamic runtime
 *    module loader imports them too.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks generated .cts and .mts accessors have the authored paths and calls both HTTP routes.
 * @evidence contracts/testing.md#independent-expectations Controller file names have different TypeScript emit extensions, and their authored route literals establish the expected generated accessor paths.
 * @evidence contracts/testing.md#distinguishing-cases Both CommonJS .cts and ESM .mts controller sources must participate; successful calls detect an emitted-name loader omission beyond just path generation.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under source-extension/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The source-extension fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Both CommonJS .cts and ESM .mts controller sources must participate; successful calls detect an emitted-name loader omission beyond just path generation.
 */
export const test_source_extension = async (
  connection: api.IConnection,
): Promise<void> => {
  api.functional.source_extension.cts.METADATA;
  api.functional.source_extension.mts.METADATA;

  if (api.functional.source_extension.cts.path() !== "/source-extension/cts")
    throw new Error("Generated SDK must include the .cts controller route.");
  if (api.functional.source_extension.mts.path() !== "/source-extension/mts")
    throw new Error("Generated SDK must include the .mts controller route.");

  await api.functional.source_extension.cts(connection);
  await api.functional.source_extension.mts(connection);
};
