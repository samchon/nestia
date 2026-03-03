import typia from "typia";

import api from "../../../../api";
import type { process } from "../../../../api/structures/process";

export const test_api_performance_cpu = async (connection: api.IConnection) => {
  const output: process.global.NodeJS.CpuUsage =
    await api.functional.performance.cpu(connection);
  typia.assert(output);
};
