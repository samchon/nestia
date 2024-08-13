import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: ICategory;
    },
    200
  > = await api.functional.arrayRecursive.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
