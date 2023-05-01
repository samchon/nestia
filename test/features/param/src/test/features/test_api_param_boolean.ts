import typia from "typia";

import api from "@api";

import { TestValidator } from "../../../../../../packages/e2e/src/TestValidator";

export const test_api_param_boolean = async (
    connection: api.IConnection,
): Promise<void> => {
    const value: boolean = await api.functional.param.boolean(
        connection,
        false,
    );
    typia.assert(value);

    TestValidator.equals("false")(false)(
        await api.functional.param.boolean(connection, 0 as any),
    );
    TestValidator.equals("true")(true)(
        await api.functional.param.boolean(connection, 1 as any),
    );

    await TestValidator.error("number")(() =>
        api.functional.param.boolean(connection, 2 as any),
    );
    await TestValidator.error("string")(() =>
        api.functional.param.boolean(connection, "string" as any),
    );
};
