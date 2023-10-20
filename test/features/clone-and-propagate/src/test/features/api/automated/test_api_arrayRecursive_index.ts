import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursive } from "../../../../api/structures/ArrayRecursive";

export const test_api_arrayRecursive_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: Array<ArrayRecursive.ICategory>;
    }> = await api.functional.arrayRecursive.index(
        connection,
    );
    typia.assert(output);
};