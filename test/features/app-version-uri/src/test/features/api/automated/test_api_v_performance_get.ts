import typia from "typia";

import api from "../../../../api";
import type { IPerformance } from "../../../../api/structures/IPerformance";

export const test_api_v_performance_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.v.performance.get(
        connection,
    );
    typia.assert(output);
};