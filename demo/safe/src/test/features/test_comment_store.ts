import TSON from "typescript-json";
import api from "../../api";
import { ISaleArticleComment } from "../../api/structures/ISaleArticleComment";

export async function test_comment_store(
    connection: api.IConnection,
): Promise<void> {
    const comment: ISaleArticleComment =
        await api.functional.consumers.sales.articles.comments.store(
            connection,
            "general",
            "sale-id",
            "article-id",
            {
                body: "content-body",
                extension: "md",
                annonymous: true,
            },
        );
    TSON.assertType(comment);
}
