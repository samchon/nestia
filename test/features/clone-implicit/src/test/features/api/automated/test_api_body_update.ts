import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import api from "../../../../api";

export const test_api_body_update = async (connection: api.IConnection) => {
  const output: void = await api.functional.body.update(
    connection,
    typia.random<string & Format<"uuid">>(),
    typia.random<{
      title: string;
      body: string;
    }>(),
  );
  typia.assert(output);
};
