import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_operationId_custom = async (
  connection: api.IConnection,
) => {
  const output: Primitive<void> =
    await api.functional.operationId.custom(connection);
  typia.assert(output);
};
