import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";

export const test_api_users_user_updateUserProfile = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: IUser;
    },
    201
  > = await api.functional.users.user.updateUserProfile(connection, {
    user_id: typia.random<string>(),
    body: typia.random<api.functional.users.user.updateUserProfile.Body>(),
  });
  typia.assert(output);
};
