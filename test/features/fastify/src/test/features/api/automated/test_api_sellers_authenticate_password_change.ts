import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { ISeller } from "./../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_password_change = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.sellers.authenticate.password.change(
        connection,
        typia.random<Primitive<ISeller.IChangePassword>>(),
    );
};