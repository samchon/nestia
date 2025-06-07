import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IPerson } from "../../../../api/structures/IPerson";

export const test_api_arraySimple_store = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: IPerson;
    },
    201
  > = await api.functional.arraySimple.store(
    connection,
    typia.random<api.functional.arraySimple.store.Body>(),
  );
  typia.assert(output);
};
