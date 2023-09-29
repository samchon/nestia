import typia from "typia";

import api from "../../../../api";

export const test_api_partial_dto_test_original = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.partial_dto_test.original(
        connection,
    );
    typia.assert(output);
};