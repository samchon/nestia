import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";

export const test_api_users_user_updateUserProfile = async (
  connection: api.IConnection,
) => {
  const output: IUser = await api.functional.users.user.updateUserProfile(
    connection,
    {
      user_id: typia.random<string>(),
      body: typia.random<api.functional.users.user.updateUserProfile.Body>(),
    },
  );
  typia.assert(output);
};
