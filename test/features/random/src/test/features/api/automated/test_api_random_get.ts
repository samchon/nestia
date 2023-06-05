import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_random_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.random.get(
            connection,
        );
    typia.assert(output);
};