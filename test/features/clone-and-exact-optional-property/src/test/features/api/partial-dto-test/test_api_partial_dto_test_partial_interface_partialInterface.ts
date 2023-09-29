import typia from "typia";

import api from "../../../../api";

export const test_api_partial_dto_test_partial_interface_partialInterface = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.partial_dto_test.partial_interface.partialInterface(
        connection,
        {} as any
    );
    typia.assert(output);
};