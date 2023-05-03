import typia from "typia";

import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_param_number = async (
    connection: api.IConnection,
): Promise<void> => {
    const value: number = await api.functional.param.number(connection, 1);
    typia.assert(value);

    await TestValidator.error("boolean")(() =>
        api.functional.param.number(connection, true as any),
    );
    await TestValidator.error("string")(() =>
        api.functional.param.number(connection, "string" as any),
    );
};
