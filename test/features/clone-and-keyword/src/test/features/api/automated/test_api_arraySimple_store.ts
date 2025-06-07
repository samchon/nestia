import typia from "typia";

import api from "../../../../api";
import type { IPerson } from "../../../../api/structures/IPerson";

export const test_api_arraySimple_store = async (
  connection: api.IConnection,
) => {
  const output: IPerson = await api.functional.arraySimple.store(connection, {
    body: typia.random<api.functional.arraySimple.store.Body>(),
  });
  typia.assert(output);
};
