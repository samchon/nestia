import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_bbs_articles_query = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage<IBbsArticle.ISummary>> = await api.functional.bbs.articles.query(
        connection,
        typia.random<Resolved<null | string>>(),
        typia.random<Resolved<IPage.IRequest>>(),
    );
    typia.assert(output);
};