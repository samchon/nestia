import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies URL-encoded typed body fields preserve scalars and repeated arrays.
 *
 * Generated form-body serialization and TypedQuery.Body validation connect
 * through HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored atomic text, numeric limit, boolean enforce and two
 *    distinct values must return exactly with no extra fields.
 */
export const test_api_query_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    atomic: "atomic",
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.body(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("body", result, input);
};
