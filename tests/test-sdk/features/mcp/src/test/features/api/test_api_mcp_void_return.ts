import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK wrappers handle void tool results as
 * `Promise<void>`.
 *
 * MCP represents no-content tool results with an empty `content` array. The
 * generated wrapper must not try to parse the first text item when the
 * controller return type is `void`.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call the generated `notify` wrapper, whose controller returns `void`.
 * 3. Assert the wrapper resolves to `undefined`.
 */
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
