import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_sellers_authenticate_exit = async (
  connection: api.IConnection,
) => {
  const output: Primitive<void> =
    await api.functional.sellers.authenticate.exit(connection);
  typia.assert(output);
};
