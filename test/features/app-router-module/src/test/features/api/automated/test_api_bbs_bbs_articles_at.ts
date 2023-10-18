import type { Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_bbs_articles_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.bbs.bbs.articles.at(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
    );
    typia.assert(output);
};