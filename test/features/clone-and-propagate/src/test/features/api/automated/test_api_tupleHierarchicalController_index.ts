import typia from "typia";

import api from "../../../../api";

export const test_api_tupleHierarchicalController_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.tupleHierarchicalController.index(
        connection,
    );
    typia.assert(output);
};