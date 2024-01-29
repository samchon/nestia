import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArrayRecursiveUnionExplicit } from "../../../../api/structures/ArrayRecursiveUnionExplicit";

export const test_api_arrayRecursiveUnionExplicit_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: ArrayRecursiveUnionExplicit.IBucket;
  }> = await api.functional.arrayRecursiveUnionExplicit.store(
    connection,
    typia.random<ArrayRecursiveUnionExplicit.IBucket>(),
  );
  typia.assert(output);
};
