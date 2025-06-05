import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";

export const test_api_users_user_getUserProfile = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      202: IUser;
      404: "404 Not Found";
    },
    202
  > = await api.functional.users.user.getUserProfile(connection, {
    user_id: typia.random<string>(),
    query: typia.random<IUser.ISearch>(),
  });
  typia.assert(output);
};
