import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api/common";
import type { IPerformance } from "../../../../api/structures/IPerformance";

export const test_api_performance_get = async (connection: api.IConnection) => {
  const output: Primitive<IPerformance> =
    await api.functional.performance.get(connection);
  typia.assert(output);
};
