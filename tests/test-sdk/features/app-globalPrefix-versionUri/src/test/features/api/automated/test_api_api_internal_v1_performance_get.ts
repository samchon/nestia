import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IPerformance } from "../../../../api/structures/IPerformance";

export const test_api_api_internal_v1_performance_get = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPerformance> =
    await api.functional.api.internal.v1.performance.get(connection);
  typia.assert(output);
};
