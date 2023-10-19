import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_body = async (
    connection: api.IConnection,
): Promise<void> => {
    await TestValidator.httpError("invalid")(400)(() =>
        api.functional.body.store(connection, {
            ...typia.random<IBbsArticle.IStore>(),
            title: null!,
        }),
    );
};
