import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

export const test_api_headers = async (
    connection: api.IConnection,
): Promise<void> => {
    const input: Required<IHeaders> = {
        ...typia.random<Required<IHeaders>>(),
        "x-values": [1, 2, 3],
        "x-flags": [true, false, true],
        "x-descriptions": ["a", "b", "c"],
    };
    const output: IHeaders = await api.functional.headers.emplace(
        {
            ...connection,
            headers: {
                "x-category": input["x-category"],
                "x-memo": input["x-memo"],
                "x-name": input["x-name"],
                "x-values": input["x-values"].join(", "),
                "x-flags": input["x-flags"].join(", "),
                "x-descriptions": input["x-descriptions"].join(", "),
            },
        },
        "something",
    );
    typia.assertEquals(output);
    TestValidator.equals("headers")(input)(output as Required<IHeaders>);

    await TestValidator.error("headers")(() =>
        api.functional.headers.emplace(
            {
                ...connection,
                headers: {
                    "x-category": input["x-category"],
                    "x-memo": input["x-memo"],
                    "x-name": input["x-name"],
                    "x-values": "one, two, three",
                    "x-flags": input["x-flags"].join(", "),
                    "x-descriptions": input["x-descriptions"].join(", "),
                },
            },
            "something",
        ),
    );
};
