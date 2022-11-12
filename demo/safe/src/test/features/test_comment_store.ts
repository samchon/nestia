import TSON from "typescript-json";
import { v4 } from "uuid";

import api from "../../api";
import { ISaleArticleComment } from "../../api/structures/ISaleArticleComment";

export async function test_comment_store(
    connection: api.IConnection,
): Promise<void> {
    const comment: ISaleArticleComment =
        await api.functional.consumers.sales.articles.comments.store(
            connection,
            "abcdef0",
            v4(),
            v4(),
            {
                body: "content-body",
                extension: "md",
                annonymous: true,
            },
        );
    TSON.assert(comment);
}
