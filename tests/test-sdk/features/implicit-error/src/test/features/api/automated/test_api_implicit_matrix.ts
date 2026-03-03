import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_implicit_matrix = async (connection: api.IConnection) => {
  const output: Primitive<any> =
    await api.functional.implicit.matrix(connection);
  typia.assert(output);
};
