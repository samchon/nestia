import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_exception_composite = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.exception.composite(
            connection,
            typia.random<Primitive<string>>(),
            typia.random<Primitive<IBbsArticle.IStore>>(),
        );
    typia.assert(output);
};