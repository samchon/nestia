import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionExplicit } from "../../../../api/structures/ArrayRecursiveUnionExplicit";

export const test_api_arrayRecursiveUnionExplicit_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ArrayRecursiveUnionExplicit;
    }> = await api.functional.arrayRecursiveUnionExplicit.index(
        connection,
    );
    typia.assert(output);
};