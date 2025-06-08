import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_param_literal = async (connection: api.IConnection) => {
  const output: Primitive<"A" | "B" | "C"> = await api.functional.param.literal(
    connection,
    {
      value: typia.random<"A" | "B" | "C">(),
    },
  );
  typia.assert(output);
};
