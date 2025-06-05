import typia from "typia";

import api from "../../../../api";
import type { ISeller } from "../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_password_change = async (
  connection: api.IConnection,
) => {
  const output: void =
    await api.functional.sellers.authenticate.password.change(connection, {
      input: typia.random<ISeller.IChangePassword>(),
    });
  typia.assert(output);
};
