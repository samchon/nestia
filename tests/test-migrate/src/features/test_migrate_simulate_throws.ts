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
