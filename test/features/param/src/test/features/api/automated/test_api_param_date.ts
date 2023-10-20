import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_param_date = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = await api.functional.param.date(
        connection,
        typia.random<Resolved<string & Format<"date">>>(),
    );
    typia.assert(output);
};