import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ISeller } from "../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_login = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<ISeller.IAuthorized> = await api.functional.sellers.authenticate.login(
        connection,
        typia.random<Primitive<ISeller.ILogin>>(),
    );
    typia.assert(output);
};