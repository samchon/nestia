import type { IPropagation, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { TupleHierarchical } from "../../../../api/structures/TupleHierarchical";

export const test_api_tupleHierarchicalController_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: TupleHierarchical;
    }> = await api.functional.tupleHierarchicalController.at(
        connection,
        typia.random<Resolved<number>>(),
    );
    typia.assert(output);
};