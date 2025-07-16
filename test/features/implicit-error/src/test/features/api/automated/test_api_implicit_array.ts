import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_implicit_array = async (connection: api.IConnection) => {
  const output: Primitive<any> =
    await api.functional.implicit.array(connection);
  typia.assert(output);
};
