import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

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
    ...input,
    limit: input.limit ? `${input.limit}` : undefined,
    enforce: input.enforce ? "true" : "false",
    atomic: input.atomic ? input.atomic : "null",
  });
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
