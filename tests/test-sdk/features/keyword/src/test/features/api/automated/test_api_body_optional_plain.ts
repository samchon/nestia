import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";

export const test_api_body_optional_plain = async (
  connection: api.IConnection,
) => {
  const output: Primitive<string> = await api.functional.body.optional.plain(
    connection,
    {
      body: typia.random<string>(),
    },
  );
  typia.assert(output);
};
