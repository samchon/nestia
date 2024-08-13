import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayICategory } from "../../../../api/structures/ArrayICategory";

export const test_api_arrayRecursive_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ArrayICategory;
    },
    200
  > = await api.functional.arrayRecursive.index(connection);
  typia.assert(output);
};
