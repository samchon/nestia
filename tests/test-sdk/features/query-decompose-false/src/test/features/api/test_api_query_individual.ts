import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a named scalar query parameter echoes its exact value.
 *
 * Generated scalar query naming must match the controller Query id field over
 * HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored some-value text must survive query encoding and named
 *    Query extraction unchanged.
 */
export const test_api_query_individual = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: string = "some-value";
  const value: string = await api.functional.query.individual(
    connection,
    "some-value",
  );
  typia.assertEquals(value);
  TestValidator.equals("individual", input, value);
};
