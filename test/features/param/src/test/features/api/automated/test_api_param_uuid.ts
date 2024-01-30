import type { Primitive } from "@nestia/fetcher";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_param_uuid = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.param.uuid(
    connection,
    typia.random<string & Format<"uuid">>(),
  );
  typia.assert(output);
};
