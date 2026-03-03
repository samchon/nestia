import typia from "typia";
import type { Resolved } from "typia";

import api from "../../../../api";

export const test_api_plain_send = async (connection: api.IConnection) => {
  const output: Resolved<string> = await api.functional.plain.send(connection, {
    body: typia.random<string>(),
  });
  typia.assert(output);
};
