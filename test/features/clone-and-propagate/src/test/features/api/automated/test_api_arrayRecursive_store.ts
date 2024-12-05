import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ICategory } from "../../../../api/structures/ICategory";

export const test_api_arrayRecursive_store = async (
  connection: api.IConnection,
) => {
  const input: ICategory = typia.random<ICategory>();
  const output: IPropagation<
    {
      201: ICategory;
    },
    201
  > = await api.functional.arrayRecursive.store(connection, input);
  try {
    typia.assert(output);
  } catch (exp) {
    console.log(typia.validate(output));
    throw exp;
  }
};
