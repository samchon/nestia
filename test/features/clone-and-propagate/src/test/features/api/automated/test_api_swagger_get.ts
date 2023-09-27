import typia from "typia";

import api from "../../../../api";

export const test_api_swagger_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.swagger.get(
        connection,
    );
    typia.assert(output);
};