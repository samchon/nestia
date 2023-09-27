import typia from "typia";

import api from "../../../../api";

export const test_api_objectUnionExplicit_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.objectUnionExplicit.get(
        connection,
    );
    typia.assert(output);
};