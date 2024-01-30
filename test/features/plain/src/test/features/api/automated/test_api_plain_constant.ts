import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_plain_constant = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.plain.constant(
    connection,
    typia.random<"A" | "B" | "C">(),
  );
  typia.assert(output);
};
