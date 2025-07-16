import { INestiaConfig } from "@nestia/sdk";
import typia from "typia";
import { v4 } from "uuid";

import api from "@api";

export async function testApiExternalCompile(
  connection: api.IConnection,
): Promise<void> {
  const result: INestiaConfig.ISwaggerConfig = await api.functional.pnpm.config(
    connection,
    v4(),
    {
      domain: "nothing",
    },
    {
      count: 3,
    },
  );
  typia.assert(result);
}
