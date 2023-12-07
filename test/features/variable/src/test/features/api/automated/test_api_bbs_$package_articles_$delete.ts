import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_bbs_$package_articles_$delete = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.bbs.$package.articles.$delete(
        connection,
        typia.random<Resolved<string>>(),
    );
};