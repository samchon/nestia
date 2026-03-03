import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_store = async (
  connection: api.IConnection,
) => {
  const output: ICategory = await api.functional.arrayRecursive.store(
    connection,
    {
      body: typia.random<ICategory>(),
    },
  );
  typia.assert(output);
};
