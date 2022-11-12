import TSON from "typescript-json";
import api from "../../api";
import { ISaleArticleComment } from "../../api/structures/ISaleArticleComment";

export async function test_consumer_sale_article_comment_store(
    connection: api.IConnection,
): Promise<void> {
    const comment: ISaleArticleComment =
        await api.functional.consumers.sales.articles.comments.store(
            connection,
            "general",
            0,
            0,
            {
                body: "Some body content",
                extension: "md",
                annonymous: true,
            },
        );
    TSON.assert(comment);
}
