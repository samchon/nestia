import typia from "typia";

import api from "@api";
import { IPerformance } from "../../../../features/multipart-form-data/api/structures/IPerformance";

export const test_api_monitor_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.multipart_form_data.performance.get(connection);
  typia.assert(performance);
};
