import TSON from "typescript-json";
import api from "../../api";
import { ISaleEntireArtcle } from "../../api/structures/ISaleEntireArticle";

export async function test_sale_entire_articles_at(
    connection: api.IConnection,
): Promise<void> {
    const article: ISaleEntireArtcle =
        await api.functional.consumers.sales.entire_articles.at(
            connection,
            "general",
            0,
            0,
        );
    TSON.assert(article);
}
