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
 * @evidence contracts/testing.md#behavioral-verification The freshly emitted generated SDK simulator must reject the missing authorization header as HttpError 400 and resolve the identical route with that header present.
 * @evidence contracts/testing.md#independent-expectations The authored fixture requires authorization; the nonpropagating fetch contract throws HttpError for invalid requests. A literal status and constructor name distinguish rejection from an incorrectly resolved propagation object.
 * @evidence contracts/testing.md#distinguishing-cases Missing and present authorization are the adjacent invalid/valid controls; an unexpected resolved value fails the invalid case.
 * @evidence contracts/testing.md#execution-ownership The migrate integration entry passes this export the combined compiler's emitted positional SDK entry. It runs after actual Swagger generation and SDK migration; pure source assertions execute separately in the unit population.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated code, typia's composed producer and fetcher HttpError runtime must connect correctly; checking generator strings cannot establish rejected Promise behavior.
 * @evidence contracts/e2e.md#shared-execution Both requests consume the existing single combined migration compiler result. They prepare no extra consumer, compiler, application or transport host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The integration invocation owns freshly generated module trees and unique combined emission. Simulation is enabled explicitly, and a loopback port without a host makes accidental real transport fail.
 * @evidence contracts/e2e.md#preserved-coverage Both original missing-header rejection and valid-header resolution execute against the positional SDK from the same rich Swagger document; only the emitted entry's location changes.
 */
export const test_migrate_simulate_throws = async (
  entry: string,
): Promise<void> => {
  const api = require(entry);
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
