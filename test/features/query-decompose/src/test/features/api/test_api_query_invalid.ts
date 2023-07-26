import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_query_invalid = async (
    connection: api.IConnection,
): Promise<void> => {
    TestValidator.httpError("invalid")(400)(() =>
        api.functional.query.typed(connection, {
            limit: 10,
            enforce: "something" as any,
            values: ["a", "b", "c"],
            atomic: "atomic",
        }),
    );
};
