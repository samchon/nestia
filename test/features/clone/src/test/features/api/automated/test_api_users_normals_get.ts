import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IAuthentication } from "../../../../api/structures/IAuthentication";

export const test_api_users_normals_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.users.normals.get(
        connection,
        typia.random<Resolved<IAuthentication.IQuery>>(),
    );
    typia.assert(output);
};