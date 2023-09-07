import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_bbs_$package_articles_$catch = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.bbs.$package.articles.$catch(
        connection,
        typia.random<Resolved<null | string>>(),
        typia.random<Resolved<IPage.IRequest>>(),
    );
    typia.assert(output);
};