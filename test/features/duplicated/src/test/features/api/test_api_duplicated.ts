import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_duplicated = async (
    connection: api.IConnection,
): Promise<void> => {
    const [x, y]: [IBbsArticle, IBbsArticle] = [
        await api.functional.duplicated.at(connection),
        await api.functional.multiple.at(connection),
    ];
    typia.assertEquals([x, y]);

    TestValidator.equals("duplicated")(x)(y);
};
