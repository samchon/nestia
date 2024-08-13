import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_tupleRestController_get = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: [boolean, number, ...string[]];
    },
    200
  > = await api.functional.tupleRestController.get(connection);
  typia.assert(output);
};
