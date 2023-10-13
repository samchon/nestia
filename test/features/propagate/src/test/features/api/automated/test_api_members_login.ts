import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IForbidden } from "../../../../api/structures/IForbidden";
import type { IMember } from "../../../../api/structures/IMember";
import type { INotFound } from "../../../../api/structures/INotFound";

export const test_api_members_login = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.members.login(
        connection,
        typia.random<Primitive<IMember.ILogin>>(),
    );
    typia.assert(output);
};