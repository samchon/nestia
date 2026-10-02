import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies typed query serialization retains a nullable null field.
 *
 * Generated null serialization must agree with native TypedQuery null decoding.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the nullable atomic field must remain null alongside valid numeric,
 *    boolean and array neighbors rather than become omitted or textual null.
 */
export const test_api_query_null = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: null,
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.typed(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
