import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_duplicated_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = await api.functional.duplicated.at(
        connection,
    );
    typia.assert(output);
};