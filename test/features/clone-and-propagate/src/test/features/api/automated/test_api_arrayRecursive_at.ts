import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursive } from "../../../../api/structures/ArrayRecursive";

export const test_api_arrayRecursive_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: ArrayRecursive.ICategory;
  }> = await api.functional.arrayRecursive.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
