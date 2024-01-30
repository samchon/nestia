import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBucket } from "../../../../api/structures/IBucket";

export const test_api_arrayRecursiveUnionExplicit_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: IBucket;
  }> = await api.functional.arrayRecursiveUnionExplicit.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
