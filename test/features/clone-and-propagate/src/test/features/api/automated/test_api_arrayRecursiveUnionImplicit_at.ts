import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBucket } from "../../../../api/structures/IBucket";

export const test_api_arrayRecursiveUnionImplicit_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    200: IBucket.o1;
  }> = await api.functional.arrayRecursiveUnionImplicit.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
