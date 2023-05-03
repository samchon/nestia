import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_param_literal = async (
    connection: api.IConnection,
): Promise<void> => {
    for (const value of ["A", "B", "C"] as const) {
        const result = await api.functional.param.literal(connection, value);
        TestValidator.equals("literal")(value)(result);
    }

    await TestValidator.error("string")(() =>
        api.functional.param.literal(connection, "D" as any),
    );
    await TestValidator.error("number")(() =>
        api.functional.param.literal(connection, 1 as any),
    );
    await TestValidator.error("boolean")(() =>
        api.functional.param.literal(connection, true as any),
    );
};
