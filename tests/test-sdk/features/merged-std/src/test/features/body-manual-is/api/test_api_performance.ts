import typia from "typia";

import api from "@api";
import { IPerformance } from "../../../../features/body-manual-is/api/structures/IPerformance";

export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.body_manual_is.performance.get(connection);
  typia.assert(performance);
};
