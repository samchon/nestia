import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_implicit_object2 = async (
  connection: api.IConnection,
) => {
  const output: Primitive<any> =
    await api.functional.implicit.object2(connection);
  typia.assert(output);
};
