import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_body = async (
    connection: api.IConnection,
): Promise<void> => {
    const article: IBbsArticle = await api.functional.body.store(
        connection,
        typia.random<IBbsArticle.IStore>(),
    );
    typia.assertEquals(article);
};
