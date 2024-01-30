import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBucket } from "../../../../api/structures/IBucket";

export const test_api_arrayRecursiveUnionImplicit_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: IBucket.o1;
  }> = await api.functional.arrayRecursiveUnionImplicit.store(
    connection,
    typia.random<IBucket.o1>(),
  );
  typia.assert(output);
};
