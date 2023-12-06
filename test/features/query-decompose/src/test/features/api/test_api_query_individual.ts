import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

export const test_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: string = "some-value";
  const value: string = await api.functional.query.individual(
    connection,
    "some-value",
  );
  typia.assertEquals(value);
  TestValidator.equals("individual")(input)(value);
};
