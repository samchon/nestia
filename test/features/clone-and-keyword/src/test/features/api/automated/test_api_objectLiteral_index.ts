import typia from "typia";

import api from "../../../../api";
import type { ObjectLietral } from "../../../../api/structures/ObjectLietral";

export const test_api_objectLiteral_index = async (
  connection: api.IConnection,
) => {
  const output: ObjectLietral[] =
    await api.functional.objectLiteral.index(connection);
  typia.assert(output);
};
