import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_bigint = async (connection: api.IConnection) => {
  const output: Primitive<number> = await api.functional.param.bigint(
    connection,
    typia.random<bigint>(),
  );
  typia.assert(output);
};
