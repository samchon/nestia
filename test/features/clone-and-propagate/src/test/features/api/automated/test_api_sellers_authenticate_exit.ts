import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_sellers_authenticate_exit = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: undefined;
    },
    200
  > = await api.functional.sellers.authenticate.exit(connection);
  typia.assert(output);
};
