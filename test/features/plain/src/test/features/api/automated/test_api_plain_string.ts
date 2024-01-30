import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_plain_string = async (connection: api.IConnection) => {
  const output: Primitive<string> = await api.functional.plain.string(
    connection,
    typia.random<string>(),
  );
  typia.assert(output);
};
