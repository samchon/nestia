import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_index = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: ICategory[];
  }> = await api.functional.arrayRecursive.index(connection);
  typia.assert(output);
};
