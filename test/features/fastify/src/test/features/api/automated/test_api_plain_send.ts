import type { Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_plain_send = async (connection: api.IConnection) => {
  const output: Resolved<string> = await api.functional.plain.send(
    connection,
    typia.random<string>(),
  );
  typia.assert(output);
};
