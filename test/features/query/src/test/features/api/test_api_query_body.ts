import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

export const test_api_query_body = async (
    connection: api.IConnection,
): Promise<void> => {
    const input: IQuery = {
        atomic: "atomic",
        limit: 10,
        enforce: true,
        values: ["value-1", "value-2"],
    };
    const result: IQuery = await api.functional.query.body(connection, input);
    typia.assertEquals(result);
    TestValidator.equals("body")(result)(input);
};
