import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArraySimple } from "../../../../api/structures/ArraySimple";

export const test_api_arraySimple_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ArraySimple;
    }> = await api.functional.arraySimple.index(
        connection,
    );
    typia.assert(output);
};