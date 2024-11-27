import typia from "typia";
import type { Resolved } from "typia";

import api from "../../../../api";

export const test_api_plain_constant = async (connection: api.IConnection) => {
  const output: Resolved<string> = await api.functional.plain.constant(
    connection,
    typia.random<"A" | "B" | "C">(),
  );
  typia.assert(output);
};
