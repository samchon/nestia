import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { TupleHierarchical } from "../../../../api/structures/TupleHierarchical";

export const test_api_tupleHierarchicalController_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: Array<TupleHierarchical>;
    }> = await api.functional.tupleHierarchicalController.index(
        connection,
    );
    typia.assert(output);
};