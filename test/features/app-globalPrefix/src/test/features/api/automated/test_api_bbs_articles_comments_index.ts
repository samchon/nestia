import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsComment } from "../../../../api/structures/IBbsComment";
import type { IPage } from "../../../../api/structures/IPage";

export const test_api_bbs_articles_comments_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IPage<IBbsComment>> = await api.functional.bbs.articles.comments.index(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
        typia.random<Resolved<IPage.IRequest>>(),
    );
    typia.assert(output);
};