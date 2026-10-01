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
 * @evidence contracts/testing.md#behavioral-verification It loads the compiled SDK generated with `simulate`, calls a route that requires an `authorization` header without it and asserts a rejected 400 `HttpError`, then with it and asserts it resolves.
 * @evidence contracts/testing.md#independent-expectations The SDK's real fetch throws `HttpError` for a 400, and the simulator must behave alike, so the expected error class and status come from the fetcher's contract.
 * @evidence contracts/testing.md#distinguishing-cases The invalid and the valid call to the same route differ only by the header, so both a simulator that swallows the error and one that always throws are detected.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-migrate` suite), called by the suite entry `src/index.ts` after `nestia swagger` has generated the fixture document from a real project; the generated SDK and NestJS projects are compiled by `ttsc` in the same suite.
 * @evidence contracts/e2e.md#necessary-boundary It needs the SDK compiled by `ttsc` and loaded as a module, because the defect was in the emitted simulate function, whose behavior is only observable by running it.
 * @evidence contracts/e2e.md#shared-execution It runs against the SDK the suite already generated and compiled for the fixture in positional mode; no extra generation or compilation is done for it.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity It only reads the compiled output and calls the simulator, which starts no server and keeps no state.
 * @evidence contracts/e2e.md#preserved-coverage The generated text of the simulate function is asserted by unit tests in `test-unit`; this case keeps the run.
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
