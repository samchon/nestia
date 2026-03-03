import { IEmbedTypeScriptResult } from "embed-typescript";
import typia from "typia";

import api from "@api";

export async function testApiExternalCompile(
  connection: api.IConnection,
): Promise<void> {
  const result: IEmbedTypeScriptResult = await api.functional.external.compile(
    connection,
    {},
  );
  typia.assert(result);
}
