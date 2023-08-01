import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IHeaders } from "./../../../../api/structures/IHeaders";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_headers_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.headers.store(
            {
                ...connection,
                headers: {
                    ...(connection.headers ?? {}),
                    ...typia.random<IHeaders>(),
                },
            },
            typia.random<Primitive<string>>(),
            typia.random<Primitive<IBbsArticle.IStore>>(),
        );
    typia.assert(output);
};