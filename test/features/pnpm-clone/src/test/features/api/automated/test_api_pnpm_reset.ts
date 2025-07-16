import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_pnpm_reset = async (connection: api.IConnection) => {
  const output: IPropagation<
    {
      200: void;
    },
    200
  > = await api.functional.pnpm.reset(connection);
  typia.assert(output);
};
