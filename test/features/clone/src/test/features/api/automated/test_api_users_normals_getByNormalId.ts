import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { INormal } from "../../../../api/structures/INormal";

export const test_api_users_normals_getByNormalId = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.users.normals.getByNormalId(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<INormal>>(),
    );
    typia.assert(output);
};