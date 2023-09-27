import typia from "typia";

import api from "../../../../api";

export const test_api_arrayRecursive_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursive.index(
        connection,
    );
    typia.assert(output);
};