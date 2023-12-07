import type { IPropagation, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionExplicit } from "../../../../api/structures/ArrayRecursiveUnionExplicit";

export const test_api_arrayRecursiveUnionExplicit_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ArrayRecursiveUnionExplicit.IBucket;
    }> = await api.functional.arrayRecursiveUnionExplicit.at(
        connection,
        typia.random<Resolved<number>>(),
    );
    typia.assert(output);
};