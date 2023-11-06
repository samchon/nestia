import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_body_invalid = async (
    connection: api.IConnection,
): Promise<void> => {
    try {
        await api.functional.body.store(connection, {
            ...typia.random<IBbsArticle.IStore>(),
            title: null!,
        });
    } catch (error) {
        console.log(error);
    }
    await TestValidator.httpError("invalid")(400)(() =>
        api.functional.body.store(connection, {
            ...typia.random<IBbsArticle.IStore>(),
            title: null!,
        }),
    );
};
