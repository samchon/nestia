import typia from "typia";

import api from "../../../../api";

export const test_api_arraySimple_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arraySimple.index(
        connection,
    );
    typia.assert(output);
};