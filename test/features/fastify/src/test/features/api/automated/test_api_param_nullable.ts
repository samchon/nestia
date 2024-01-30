import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_param_nullable = async (connection: api.IConnection) => {
  const output: Primitive<null | string> = await api.functional.param.nullable(
    connection,
    typia.random<null | string>(),
  );
  typia.assert(output);
};
