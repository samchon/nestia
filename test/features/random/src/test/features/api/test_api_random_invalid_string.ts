import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_random_invalid_string = (
    connection: api.IConnection
): Promise<void> => 
    TestValidator.httpError("invalid string")(400)(() => 
        api.functional.bbs.articles.at(
            connection,
            null!,
            uuid(),
        ),
    );

const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });