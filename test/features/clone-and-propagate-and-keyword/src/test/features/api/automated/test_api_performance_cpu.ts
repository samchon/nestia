import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { process } from "../../../../api/structures/process";

export const test_api_performance_cpu = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: process.global.NodeJS.CpuUsage;
    },
    200
  > = await api.functional.performance.cpu(connection);
  typia.assert(output);
};
