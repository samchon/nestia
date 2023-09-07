import typia from "typia";

import api from "../../../../api";

export const test_api_performance_cpu = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.performance.cpu(
        connection,
    );
    typia.assert(output);
};