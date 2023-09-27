import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IAuthentication } from "../../../../api/structures/IAuthentication";

export const test_api_users_oauth_getOauthProfile = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.users.oauth.getOauthProfile(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Resolved<IAuthentication>>(),
    );
    typia.assert(output);
};