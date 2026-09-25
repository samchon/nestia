import typia from "typia";

import api from "@api";

import { IPerformance } from "../../../../features/exception-filter/api/structures/IPerformance";

export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.exception_filter.performance.get(connection);
  typia.assert(performance);
};
