import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_bbs_article_update = async (
    connection: api.IConnection,
): Promise<void> => {
    const article: IBbsArticle = await api.functional.bbs.articles.store(
        connection,
        typia.random<IBbsArticle.IStore>(),
    );
    typia.assertEquals(article);

    await api.functional.bbs.articles.update(
        connection,
        article.id,
        typia.random<IBbsArticle.IUpdate>(),
    );
};
