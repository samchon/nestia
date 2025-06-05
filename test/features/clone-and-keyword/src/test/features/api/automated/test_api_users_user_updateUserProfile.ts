import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";
import type { PartialPickIUsernameemailoptional_attrnullable_attr } from "../../../../api/structures/PartialPickIUsernameemailoptional_attrnullable_attr";

export const test_api_users_user_updateUserProfile = async (
  connection: api.IConnection,
) => {
  const output: IUser = await api.functional.users.user.updateUserProfile(
    connection,
    {
      user_id: typia.random<string>(),
      body: typia.random<PartialPickIUsernameemailoptional_attrnullable_attr>(),
    },
  );
  typia.assert(output);
};
