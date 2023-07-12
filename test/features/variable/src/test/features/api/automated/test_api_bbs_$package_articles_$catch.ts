import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IPage } from "./../../../../api/structures/IPage";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_bbs_$package_articles_$catch = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage<IBbsArticle.ISummary>> = 
        await api.functional.bbs.$package.articles.$catch(
            connection,
            typia.random<Primitive<null | string>>(),
            typia.random<Primitive<IPage.IRequest>>(),
        );
    typia.assert(output);
};