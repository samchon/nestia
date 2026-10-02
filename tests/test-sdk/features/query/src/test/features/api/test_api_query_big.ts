import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBigQuery } from "@api/lib/structures/IBigQuery";

/**
 * Verifies URL-encoded bigint and null fields survive a generated body round
 * trip.
 *
 * URLSearchParams wire conversion and native typed query-body decoding must
 * agree on bigint and null.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the controller echo must return the authored 100n and null values with
 *    the IBigQuery shape intact.
 */
export const test_api_query_big = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBigQuery = {
    value: BigInt(100),
    nullable: null,
  };
  const result: IBigQuery = await api.functional.query.big(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
