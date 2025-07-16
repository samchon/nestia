import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_nullable = async (connection: api.IConnection) => {
  const output: Primitive<string | null> = await api.functional.param.nullable(
    connection,
    {
      value: typia.random<string | null>(),
    },
  );
  typia.assert(output);
};
