import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_param_string = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = await api.functional.param.string(
        connection,
        typia.random<Resolved<string>>(),
    );
    typia.assert(output);
};