import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";

export const test_api_api_v3_articles_comments_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsComment> = await api.functional.api.v3.articles.comments.store(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
        typia.random<Primitive<IBbsComment.IStore>>(),
    );
    typia.assert(output);
};