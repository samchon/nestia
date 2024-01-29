import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArraySimple } from "../../../../api/structures/ArraySimple";

export const test_api_arraySimple_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: ArraySimple.IPerson;
  }> = await api.functional.arraySimple.store(
    connection,
    typia.random<ArraySimple.IPerson>(),
  );
  typia.assert(output);
};
