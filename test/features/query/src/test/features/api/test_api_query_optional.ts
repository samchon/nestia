import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IOptionalQuery } from "@api/lib/structures/IOptionalQuery";

export const test_api_query_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const result: IOptionalQuery =
    await api.functional.query.optional(connection);
  typia.assertEquals(result);
  TestValidator.equals("body")(result)({});
};
