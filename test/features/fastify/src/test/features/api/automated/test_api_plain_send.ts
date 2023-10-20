import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_plain_send = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = await api.functional.plain.send(
        connection,
        typia.random<Primitive<string>>(),
    );
    typia.assert(output);
};