import typia from "typia";

import api from "../../api";
import { ISaleArticleComment } from "../../api/structures/ISaleArticleComment";

export async function test_consumer_seller_article_comment_store(
    connection: api.IConnection,
): Promise<void> {
    const comment: ISaleArticleComment =
        await api.functional.sellers.sales.articles.comments.store(
            connection,
            "general",
            0,
            0,
            {
                body: "Some body content",
                extension: "txt",
                annonymous: false,
            },
        );
    typia.assert(comment);
}
