import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionExplicit } from "../../../../api/structures/ArrayRecursiveUnionExplicit";

export const test_api_arrayRecursiveUnionExplicit_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursiveUnionExplicit.store(
        connection,
        typia.random<Primitive<ArrayRecursiveUnionExplicit.IBucket>>(),
    );
    typia.assert(output);
};