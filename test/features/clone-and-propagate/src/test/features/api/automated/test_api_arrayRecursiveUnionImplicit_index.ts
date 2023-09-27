import typia from "typia";

import api from "../../../../api";

export const test_api_arrayRecursiveUnionImplicit_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursiveUnionImplicit.index(
        connection,
    );
    typia.assert(output);
};