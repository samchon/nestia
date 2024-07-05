import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IUser } from "../../../../api/structures/IUser";
import type { PartialPickIUseremailnamenullable_attroptional_attr } from "../../../../api/structures/PartialPickIUseremailnamenullable_attroptional_attr";

export const test_api_users_user_updateUserProfile = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: IUser;
  }> = await api.functional.users.user.updateUserProfile(
    connection,
    typia.random<string>(),
    typia.random<PartialPickIUseremailnamenullable_attroptional_attr>(),
  );
  typia.assert(output);
};
