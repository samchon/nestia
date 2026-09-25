import typia from "typia";

import api from "../../../../api";
import { IPerformance } from "../../../../features/route-manual-is/api/structures/IPerformance";

export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.route_manual_is.performance.get(connection);
  typia.assert(performance);
};
