import typia from "typia";

import api from "../../../../api";

export const test_api_api_v2_common_health_get = async (
  connection: api.IConnection,
) => {
  const output = await api.functional.api.v2.common.health.get(connection);
  typia.assert(output);
};
