import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IPerson } from "../../../../api/structures/IPerson";

export const test_api_arraySimple_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: IPerson[];
    },
    200
  > = await api.functional.arraySimple.index(connection);
  typia.assert(output);
};
