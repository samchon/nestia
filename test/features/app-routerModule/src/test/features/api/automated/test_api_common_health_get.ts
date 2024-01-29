import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_common_health_get = async (
  connection: api.IConnection,
) => {
  const output: Primitive<void> =
    await api.functional.common.health.get(connection);
  typia.assert(output);
};
