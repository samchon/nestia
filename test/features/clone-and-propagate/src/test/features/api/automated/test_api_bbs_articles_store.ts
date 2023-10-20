import type { IPropagation, Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_articles_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: IBbsArticle;
    }> = await api.functional.bbs.articles.store(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Primitive<IBbsArticle.IStore>>(),
    );
    typia.assert(output);
};