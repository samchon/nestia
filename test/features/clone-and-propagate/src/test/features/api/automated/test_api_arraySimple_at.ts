import type { Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_arraySimple_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.arraySimple.at(
        connection,
        typia.random<Resolved<(string & Format<"uuid">)>>(),
    );
    typia.assert(output);
};