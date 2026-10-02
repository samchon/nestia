import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies a named scalar query and a DTO query combine without losing either.
 *
 * Generated query-field and DTO argument serialization must reach their
 * distinct controller parameters.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the independent expected object combines atomic with the supplied
 *    limit, enforce and two values, retaining all declared fields.
 */
export const test_api_query_composite = async (
  connection: api.IConnection,
): Promise<void> => {
  const atomic: string = "atomic";
  const input: Omit<IQuery, "atomic"> = {
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.composite(
    connection,
    atomic,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("composite", result, {
    ...input,
    atomic,
  });
};
