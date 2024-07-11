import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_param_composite = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.param.composite(
    connection,
    typia.random<string>(),
    typia.random<string>(),
  );
  typia.assert(output);
};
