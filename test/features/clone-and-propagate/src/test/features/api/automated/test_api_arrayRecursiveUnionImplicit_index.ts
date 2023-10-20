import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionImplicit } from "../../../../api/structures/ArrayRecursiveUnionImplicit";

export const test_api_arrayRecursiveUnionImplicit_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ArrayRecursiveUnionImplicit;
    }> = await api.functional.arrayRecursiveUnionImplicit.index(
        connection,
    );
    typia.assert(output);
};