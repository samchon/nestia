import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_param_uuid_nullable = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<null | string> = await api.functional.param.uuid_nullable(
        connection,
        typia.random<Resolved<null | string & Format<"uuid">>>(),
    );
    typia.assert(output);
};