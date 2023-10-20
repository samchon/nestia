import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionImplicit } from "../../../../api/structures/ArrayRecursiveUnionImplicit";

export const test_api_arrayRecursiveUnionImplicit_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: ArrayRecursiveUnionImplicit.IBucket;
    }> = await api.functional.arrayRecursiveUnionImplicit.store(
        connection,
        typia.random<Primitive<ArrayRecursiveUnionImplicit.IBucket>>(),
    );
    typia.assert(output);
};