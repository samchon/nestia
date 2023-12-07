import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IForbidden } from "../../../../api/structures/IForbidden";
import type { IMember } from "../../../../api/structures/IMember";
import type { INotFound } from "../../../../api/structures/INotFound";

export const test_api_members_login = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: IMember;
        403: IForbidden;
        404: INotFound;
        422: IForbidden.IExpired;
    }> = await api.functional.members.login(
        connection,
        typia.random<Primitive<IMember.ILogin>>(),
    );
    typia.assert(output);
};