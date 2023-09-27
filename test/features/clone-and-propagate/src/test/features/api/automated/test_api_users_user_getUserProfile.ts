import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";

export const test_api_users_user_getUserProfile = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.users.user.getUserProfile(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<IUser.ISearch>>(),
    );
    typia.assert(output);
};