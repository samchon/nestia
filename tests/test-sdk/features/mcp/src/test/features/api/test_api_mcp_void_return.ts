/** @author wildduck - https://github.com/wildduck2 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

export const test_api_mcp_void_return = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result: api.functional.mcp.notify.Output =
      await api.functional.mcp.notify(client, { message: "generated" });
    TestValidator.equals("notify output", result, undefined);
  } finally {
    await client.close();
  }
};
