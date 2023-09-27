import typia from "typia";

import api from "../../../../api";

export const test_api_tupleRestController_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.tupleRestController.get(
        connection,
    );
    typia.assert(output);
};