import type { Resolved } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_bbs_articles_erase = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.bbs.articles.erase(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<string & Format<"uuid">>>(),
    );
};