import typia from "typia";

import api from "../../../../api";

export const test_api_performance_resource = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.performance.resource(
        connection,
    );
    typia.assert(output);
};