import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

export const test_api_query_null = async (
    connection: api.IConnection,
): Promise<void> => {
    const input: IQuery = {
        limit: 10,
        enforce: true,
        atomic: null,
        values: ["a", "b", "c"],
    };
    const result: IQuery = await api.functional.query.typed(connection, input);
    typia.assertEquals(result);
    TestValidator.equals("null")(input)(result);
};
