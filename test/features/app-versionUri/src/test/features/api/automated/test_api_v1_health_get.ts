import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_v1_health_get = async (connection: api.IConnection) => {
  const output: Primitive<void> =
    await api.functional.v1.health.get(connection);
  typia.assert(output);
};
