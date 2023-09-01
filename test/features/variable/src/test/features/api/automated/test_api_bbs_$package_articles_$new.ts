import type { Primitive } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_bbs_$package_articles_$new = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.bbs.$package.articles.$new(
            connection,
            typia.random<Primitive<string>>(),
            typia.random<Primitive<string & Format<"date">>>(),
        );
    typia.assert(output);
};