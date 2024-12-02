import typia from "typia";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_param_date = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.param.date(
    connection,
    typia.random<string & Format<"date">>(),
  );
  typia.assert(output);
};
