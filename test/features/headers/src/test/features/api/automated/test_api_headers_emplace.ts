import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IHeaders } from "./../../../../api/structures/IHeaders";

export const test_api_headers_emplace = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IHeaders> = 
        await api.functional.headers.emplace(
            {
                ...connection,
                headers: {
                    ...(connection.headers ?? {}),
                    ...typia.random<IHeaders>(),
                },
            },
            typia.random<Primitive<string>>(),
        );
    typia.assert(output);
};