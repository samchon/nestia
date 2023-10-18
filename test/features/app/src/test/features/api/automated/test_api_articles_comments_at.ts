import type { Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_articles_comments_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.articles.comments.at(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
    );
    typia.assert(output);
};