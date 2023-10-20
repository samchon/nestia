import type { IPropagation, Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { ArraySimple } from "../../../../api/structures/ArraySimple";

export const test_api_arraySimple_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ArraySimple.IPerson;
    }> = await api.functional.arraySimple.at(
        connection,
        typia.random<Resolved<(string & Format<"uuid">)>>(),
    );
    typia.assert(output);
};