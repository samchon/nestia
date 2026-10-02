import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies an invalid boolean query field rejects before the test completes.
 *
 * TypedQuery runtime rejection must arrive through the generated SDK as an HTTP
 * failure.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the enforce field alone changes from boolean to something while the
 *    other fields remain valid; the request must reject with HTTP 400 and its
 *    validator promise is awaited.
 */
export const test_api_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.query.typed(connection, {
      limit: 10,
      enforce: "something" as any,
      values: ["a", "b", "c"],
      atomic: "atomic",
    }),
  );
};
