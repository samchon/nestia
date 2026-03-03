import typia from "typia";

import api from "../../../../api";
import type { process } from "../../../../api/structures/process";

export const test_api_performance_memory = async (
  connection: api.IConnection,
) => {
  const output: process.global.NodeJS.MemoryUsage =
    await api.functional.performance.memory(connection);
  typia.assert(output);
};
