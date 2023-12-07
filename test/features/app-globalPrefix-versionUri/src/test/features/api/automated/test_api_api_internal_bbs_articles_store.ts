import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_api_internal_bbs_articles_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = await api.functional.api.internal.bbs.articles.store(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Primitive<IBbsArticle.IStore>>(),
    );
    typia.assert(output);
};