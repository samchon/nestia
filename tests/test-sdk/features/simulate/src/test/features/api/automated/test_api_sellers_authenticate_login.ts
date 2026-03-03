import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { ISeller } from "../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_login = async (
  connection: api.IConnection,
) => {
  const output: Primitive<ISeller.IAuthorized> =
    await api.functional.sellers.authenticate.login(
      connection,
      typia.random<ISeller.ILogin>(),
    );
  typia.assert(output);
};
