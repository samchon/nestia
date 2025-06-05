import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_number = async (connection: api.IConnection) => {
  const output: Primitive<number> = await api.functional.param.number(
    connection,
    {
      value: typia.random<number>(),
    },
  );
  typia.assert(output);
};
