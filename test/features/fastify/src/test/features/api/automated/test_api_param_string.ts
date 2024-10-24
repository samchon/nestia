import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_string = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.param.string(
    connection,
    typia.random<string>(),
  );
  typia.assert(output);
};
