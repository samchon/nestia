import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_param_boolean = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.param.boolean(
        connection,
        typia.random<Resolved<false | true>>(),
    );
    typia.assert(output);
};