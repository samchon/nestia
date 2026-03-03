import typia from "typia";

import api from "../../../../api";

export const test_api_x_health_get = async (connection: api.IConnection) => {
  const output = await api.functional.x.health.get(connection);
  typia.assert(output);
};
