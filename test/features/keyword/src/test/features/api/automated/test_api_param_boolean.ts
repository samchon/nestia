import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_boolean = async (connection: api.IConnection) => {
  const output: Primitive<boolean> = await api.functional.param.boolean(
    connection,
    {
      value: typia.random<boolean>(),
    },
  );
  typia.assert(output);
};
