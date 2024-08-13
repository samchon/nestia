import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_health_get = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: undefined;
    },
    200
  > = await api.functional.health.get(connection);
  typia.assert(output);
};
