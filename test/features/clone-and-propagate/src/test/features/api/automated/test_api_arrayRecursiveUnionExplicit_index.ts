import typia from "typia";

import api from "../../../../api";

export const test_api_arrayRecursiveUnionExplicit_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursiveUnionExplicit.index(
        connection,
    );
    typia.assert(output);
};