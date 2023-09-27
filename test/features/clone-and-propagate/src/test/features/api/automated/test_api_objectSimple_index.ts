import typia from "typia";

import api from "../../../../api";

export const test_api_objectSimple_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.objectSimple.index(
        connection,
    );
    typia.assert(output);
};