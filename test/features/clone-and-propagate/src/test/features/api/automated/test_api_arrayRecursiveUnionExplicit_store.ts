import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBucket } from "../../../../api/structures/IBucket";

export const test_api_arrayRecursiveUnionExplicit_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: IBucket;
  }> = await api.functional.arrayRecursiveUnionExplicit.store(
    connection,
    typia.random<IBucket>(),
  );
  typia.assert(output);
};
