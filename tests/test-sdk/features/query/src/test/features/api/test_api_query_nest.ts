import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies Nest Query string fields are emitted and converted into the
 * controller DTO.
 *
 * Generated INestQuery string serialization and the Nest Query parser connect
 * over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert authored numeric and boolean strings and repeated values convert to
 *    the independently supplied IQuery object with exact equality.
 */
export const test_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.nest(connection, {
    limit: input.limit ? `${input.limit}` : undefined,
    enforce: input.enforce ? "true" : "false",
    atomic: input.atomic ? input.atomic : "null",
    values: input.values ?? [],
  });
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
