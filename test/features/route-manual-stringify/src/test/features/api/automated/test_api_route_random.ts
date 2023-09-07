import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";

export const test_api_route_random = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.route.random(
        connection,
    );
    typia.assert(output);
};