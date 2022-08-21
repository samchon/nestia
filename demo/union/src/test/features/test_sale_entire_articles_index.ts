import TSON from "typescript-json";

import api from "../../api";
import { IPage } from "../../api/structures/IPage";
import { ISaleEntireArtcle } from "../../api/structures/ISaleEntireArticle";

export async function test_sale_entire_articles_index(
    connection: api.IConnection,
): Promise<void> {
    const page: IPage<ISaleEntireArtcle.ISummary> =
        await api.functional.consumers.sales.entire_articles.index(
            connection,
            "general",
            0,
            "127.0.0.1",
            __filename,
            {
                referrer: "NodeJS",
                code: "some-code",
            },
            {
                limit: 10,
                page: 3,
            },
        );
    TSON.assertType(page);
}
