import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IAuthentication } from "../../../../api/structures/IAuthentication";

export const test_api_users_oauth_getOauthProfile = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: IAuthentication.IProfile;
  }> = await api.functional.users.oauth.getOauthProfile(
    connection,
    typia.random<string>(),
    typia.random<IAuthentication>(),
  );
  typia.assert(output);
};
