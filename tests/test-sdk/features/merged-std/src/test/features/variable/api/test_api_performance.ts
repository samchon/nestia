import typia from "typia";

import api from "@api";
import { IPerformance } from "../../../../features/variable/api/structures/IPerformance";

export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.variable.performance.get(connection);
  typia.assert(performance);
};
