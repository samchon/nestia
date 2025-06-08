import typia from "typia";

import api from "../../../../api";
import type { IPerson } from "../../../../api/structures/IPerson";

export const test_api_arraySimple_index = async (
  connection: api.IConnection,
) => {
  const output: IPerson[] = await api.functional.arraySimple.index(connection);
  typia.assert(output);
};
