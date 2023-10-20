import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { TupleHierarchical } from "../../../../api/structures/TupleHierarchical";

export const test_api_tupleHierarchicalController_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: TupleHierarchical;
    }> = await api.functional.tupleHierarchicalController.store(
        connection,
        typia.random<Primitive<TupleHierarchical>>(),
    );
    typia.assert(output);
};