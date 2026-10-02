import typia from "typia";

import api from "@api";
import { IPerformance } from "@api/lib/structures/IPerformance";

/** Validates the generated consumer result. */
export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.performance.get(connection);
  typia.assert(performance);
};
