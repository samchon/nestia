import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IPage } from "../../../../api/structures/IPage";
import type { IPage_lt_IBbsArticle } from "../../../../api/structures/IPage_lt_IBbsArticle";

export const test_api_bbs_articles_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage_lt_IBbsArticle.ISummary_gt_> = 
        await api.functional.bbs.articles.index(
            connection,
            typia.random<Primitive<string>>(),
            typia.random<Primitive<IPage.IRequest>>(),
        );
    typia.assert(output);
};