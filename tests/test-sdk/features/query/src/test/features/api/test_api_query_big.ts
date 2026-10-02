import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBigQuery } from "@api/lib/structures/IBigQuery";

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
