import typia from "typia";

import api from "../../../../api";
import type { ISeller } from "../../../../api/structures/ISeller";

export const test_api_sellers_authenticate_join = async (
  connection: api.IConnection,
) => {
  const output: ISeller.IAuthorized =
    await api.functional.sellers.authenticate.join(connection, {
      input: typia.random<api.functional.sellers.authenticate.join.Body>(),
    });
  typia.assert(output);
};
