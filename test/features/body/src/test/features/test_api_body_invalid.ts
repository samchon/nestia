import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

import { TestValidator } from "../../../../../../packages/e2e/src/TestValidator";

export const test_api_body = async (
    connection: api.IConnection,
): Promise<void> => {
    await TestValidator.error("invalid")(() =>
        api.functional.body.store(connection, {
            ...typia.random<IBbsArticle.IStore>(),
            title: null!,
        }),
    );
};
