import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_method_head = async (connection: api.IConnection) => {
  const output: Primitive<void> = await api.functional.method.head(connection);
  typia.assert(output);
};
