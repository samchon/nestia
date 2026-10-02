import path from "path";

/**
 * Verifies a migrated SDK's simulator throws an invalid request's `HttpError`,
 * as the SDK's real fetch does, and answers a valid one.
 *
 * The simulate function caught the validation error and returned a propagation
 * object, `{ success: false, status: 400, ... }`, in place of the response,
 * although the SDK fetches without propagation: an invalid simulated request
 * resolved with a value of the wrong type (#1748).
 *
 * 1. Load the compiled SDK of the fixture document, generated with `simulate`.
 * 2. Call a route requiring an `authorization` header without it, and assert it
 *    rejects with a 400 `HttpError`.
 * 3. Call it with the header, and assert it resolves.
 *
 * @evidence contracts/testing.md#behavioral-verification The compiled generated SDK simulator must reject omitted authorization with HttpError status 400 and resolve when authorization is provided.
 * @evidence contracts/testing.md#independent-expectations The fixture operation requires authorization and non-propagating fetch promises reject invalid requests; the independent literal error class/status distinguish returned failure objects.
 * @evidence contracts/testing.md#distinguishing-cases Missing headers exercise failure and provided authorization exercises success through the same compiled SDK.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry calls test_migrate_simulate_throws after generating and compiling its SDK fixture; this checks the producer-to-runtime connection.
 * @evidence contracts/e2e.md#necessary-boundary The generated SDK must execute typia validators through NestiaSimulator and expose the non-propagating HttpError contract; emitted-text assertions cannot establish runtime rejection semantics.
 * @evidence contracts/e2e.md#shared-execution The test consumes the positional SDK artifact already generated and compiled by the test-migrate entry; it performs no installation, compilation or host launch of its own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Both calls share the same immutable compiled SDK, but use fresh connection objects so the missing-header failure cannot mutate the later valid headers. The entry owns the generated archive lifetime.
 * @evidence contracts/e2e.md#preserved-coverage Missing-header HttpError class/status and valid-header resolution remain here; emitted validator type arguments and generated e2e headers are asserted by simulate_headers.
 */
export const test_migrate_simulate_throws = async (
  directory: string,
): Promise<void> => {
  const api = require(path.join(directory, "lib"));
  const call = (headers?: Record<string, string>) =>
    api.functional.articles.index(
      { host: "http://127.0.0.1:1", simulate: true, headers },
      {},
    );
  const status: unknown = await call().then(
    () => "resolved",
    (error: { constructor: { name: string }; status?: number }) =>
      `${error.constructor.name} ${error.status}`,
  );
  if (status !== "HttpError 400")
    throw new Error(`A request without its header answered: ${status}`);
  await call({ authorization: "Bearer token" });
};
