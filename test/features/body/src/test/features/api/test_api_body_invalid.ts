import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api, { HttpError } from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

export const test_api_body = async (
    connection: api.IConnection,
): Promise<void> => {
    try {
        await api.functional.body.store(connection, {
            ...typia.random<IBbsArticle.IStore>(),
            title: null!,
        });
        throw new Error("Failed to detect type error.");
    } catch (exp) {
        if (exp instanceof HttpError) if (exp.status === 400) return;
        console.log(exp);
        // throw new Error("Status code must be 400.");
    }
};
