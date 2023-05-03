import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IPage } from "./../../../../api/structures/IPage";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage<IBbsArticle.ISummary>> = 
        await api.functional.bbs.articles.index(
            connection,
            typia.random<Primitive<IPage.IRequest>>(),
        );
    typia.assert(output);
};