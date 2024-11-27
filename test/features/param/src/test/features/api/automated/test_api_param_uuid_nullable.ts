import typia from "typia";
import type { Primitive } from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_param_uuid_nullable = async (
  connection: api.IConnection,
) => {
  const output: Primitive<null | string> =
    await api.functional.param.uuid_nullable(
      connection,
      typia.random<null | (string & Format<"uuid">)>(),
    );
  typia.assert(output);
};
