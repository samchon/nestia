import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_arrayRecursive_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arrayRecursive.at(
        connection,
        typia.random<Resolved<number>>(),
    );
    typia.assert(output);
};