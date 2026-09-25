import typia from "typia";

import api from "@api";
import { IPerformance } from "../../../../features/param-validate/api/structures/IPerformance";

export const test_api_performance = async (
  connection: api.IConnection,
): Promise<void> => {
  const performance: IPerformance =
    await api.functional.param_validate.performance.get(connection);
  typia.assert(performance);
};
