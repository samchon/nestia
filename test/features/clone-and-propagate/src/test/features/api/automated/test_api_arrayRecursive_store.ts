import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursive } from "../../../../api/structures/ArrayRecursive";

export const test_api_arrayRecursive_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: ArrayRecursive.ICategory;
    }> = await api.functional.arrayRecursive.store(
        connection,
        typia.random<Primitive<ArrayRecursive.ICategory>>(),
    );
    typia.assert(output);
};