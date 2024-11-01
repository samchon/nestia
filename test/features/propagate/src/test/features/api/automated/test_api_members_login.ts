import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IForbidden } from "../../../../api/structures/IForbidden";
import type { IMember } from "../../../../api/structures/IMember";
import type { INotFound } from "../../../../api/structures/INotFound";

export const test_api_members_login = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      201: Primitive<IMember>;
      403: Primitive<IForbidden>;
      404: Primitive<INotFound>;
      422: Primitive<IForbidden.IExpired>;
    },
    201
  > = await api.functional.members.login(
    connection,
    typia.random<IMember.ILogin>(),
  );
  typia.assert(output);
};
