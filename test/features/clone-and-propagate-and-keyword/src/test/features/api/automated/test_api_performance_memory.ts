import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { process } from "../../../../api/structures/process";

export const test_api_performance_memory = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: process.global.NodeJS.MemoryUsage;
    },
    200
  > = await api.functional.performance.memory(connection);
  typia.assert(output);
};
