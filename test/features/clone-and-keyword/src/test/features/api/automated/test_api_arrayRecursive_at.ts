import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_at = async (
  connection: api.IConnection,
) => {
  const output: ICategory = await api.functional.arrayRecursive.at(connection, {
    id: typia.random<number>(),
  });
  typia.assert(output);
};
