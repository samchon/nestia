import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

export const test_api_headers = async (
    connection: api.IConnection,
): Promise<void> => {
    const headers: Required<IHeaders> = {
        ...typia.random<Required<IHeaders>>(),
        "x-values": [1, 2, 3],
        "x-fLags": [true, false, true],
        "X-Descriptions": ["a", "b", "c"],
    };
    const output: IHeaders = await api.functional.headers.emplace(
        {
            ...connection,
            headers,
        },
        "something",
    );
    typia.assertEquals(output);
    TestValidator.equals("headers")(headers)(output as Required<IHeaders>);

    await TestValidator.error("headers")(() =>
        api.functional.headers.emplace(
            {
                ...connection,
                headers: {
                    ...headers,
                    "x-values": ["one", "two", "three"] as any as number[],
                },
            },
            "something",
        ),
    );
};
