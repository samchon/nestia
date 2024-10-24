import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_boolean = async (connection: api.IConnection) => {
  const output: Primitive<false | true> = await api.functional.param.boolean(
    connection,
    typia.random<false | true>(),
  );
  typia.assert(output);
};
