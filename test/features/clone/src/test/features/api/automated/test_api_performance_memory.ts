import typia from "typia";

import api from "../../../../api";

export const test_api_performance_memory = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.performance.memory(
        connection,
    );
    typia.assert(output);
};