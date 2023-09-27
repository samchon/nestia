import type { Primitive, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { PartialPickIUsernameemailnullable_attroptional_attr } from "../../../../api/structures/PartialPickIUsernameemailnullable_attroptional_attr";

export const test_api_users_user_updateUserProfile = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.users.user.updateUserProfile(
        connection,
        typia.random<Resolved<string>>(),
        typia.random<Primitive<PartialPickIUsernameemailnullable_attroptional_attr>>(),
    );
    typia.assert(output);
};