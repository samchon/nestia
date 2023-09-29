import typia from "typia";

import api from "../../../../api";

export const test_api_partial_dto_test_partial_type_partialType = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.partial_dto_test.partial_type.partialType(
        connection,
        {} as any
    );
    typia.assert(output);
};