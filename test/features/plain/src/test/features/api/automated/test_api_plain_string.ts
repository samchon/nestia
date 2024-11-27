import typia from "typia";
import type { Resolved } from "typia";

import api from "../../../../api";

export const test_api_plain_string = async (connection: api.IConnection) => {
  const output: Resolved<string> = await api.functional.plain.string(
    connection,
    typia.random<string>(),
  );
  typia.assert(output);
};
