import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { TupleRest } from "../../../../api/structures/TupleRest";

export const test_api_tupleRestController_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: TupleRest;
    }> = await api.functional.tupleRestController.get(
        connection,
    );
    typia.assert(output);
};