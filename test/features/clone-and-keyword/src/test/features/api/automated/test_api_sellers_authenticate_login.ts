import typia from "typia";

import api from "../../../../api";
import type { ISeller } from "../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_login = async (
  connection: api.IConnection,
) => {
  const output: ISeller.IAuthorized =
    await api.functional.sellers.authenticate.login(connection, {
      input: typia.random<ISeller.ILogin>(),
    });
  typia.assert(output);
};
