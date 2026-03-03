import typia from "typia";

import api from "../../../../api";
import type { IAuthentication } from "../../../../api/structures/IAuthentication";

export const test_api_users_oauth_getOauthProfile = async (
  connection: api.IConnection,
) => {
  const output: IAuthentication.IProfile =
    await api.functional.users.oauth.getOauthProfile(connection, {
      user_id: typia.random<string>(),
      query: typia.random<IAuthentication>(),
    });
  typia.assert(output);
};
