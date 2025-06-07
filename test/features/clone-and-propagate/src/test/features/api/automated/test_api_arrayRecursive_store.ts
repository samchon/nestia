import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: ICategory;
    },
    201
  > = await api.functional.arrayRecursive.store(
    connection,
    typia.random<api.functional.arrayRecursive.store.Body>(),
  );
  typia.assert(output);
};
