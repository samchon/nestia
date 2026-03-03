import type { IPerformance } from "@api/lib/structures/IPerformance";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_v1_performance_get = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IPerformance> =
    await api.functional.v1.performance.get(connection);
  typia.assert(output);
};
