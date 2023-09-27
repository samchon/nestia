import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_arrayRecursiveUnionImplicit_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursiveUnionImplicit.at(
        connection,
        typia.random<Resolved<number>>(),
    );
    typia.assert(output);
};