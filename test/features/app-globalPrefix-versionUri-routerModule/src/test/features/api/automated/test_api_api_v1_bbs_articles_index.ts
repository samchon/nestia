import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_api_v1_bbs_articles_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage<IBbsArticle.ISummary>> = await api.functional.api.v1.bbs.articles.index(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<IPage.IRequest>>(),
    );
    typia.assert(output);
};