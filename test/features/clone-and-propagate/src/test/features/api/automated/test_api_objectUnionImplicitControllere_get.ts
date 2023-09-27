import typia from "typia";

import api from "../../../../api";

export const test_api_objectUnionImplicitControllere_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.objectUnionImplicitControllere.get(
        connection,
    );
    typia.assert(output);
};