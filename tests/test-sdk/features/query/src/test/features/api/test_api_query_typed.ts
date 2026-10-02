import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies typed query scalar and array fields round-trip as their declared
 * DTO.
 *
 * Generated query encoding and TypedQuery validation meet over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored limit, enforce, atomic and three values must echo exactly
 *    and satisfy IQuery with no extra fields.
 */
export const test_api_query_typed = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.typed(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("typed", input, result);
};
