import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

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
