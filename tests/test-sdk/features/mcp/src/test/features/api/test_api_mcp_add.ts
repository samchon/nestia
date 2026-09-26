import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the generated MCP SDK wrapper calls the `add` tool and parses its
 * JSON result.
 *
 * Locks the happy path for `SdkMcpRouteProgrammer`: it must pass typed
 * arguments to `client.callTool`, select the text content item, and return the
 * declared primitive output shape.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.add` with typed arguments.
 * 3. Assert the parsed result matches the controller output.
 */
export const test_api_mcp_add = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result: api.functional.mcp.add.Output = await api.functional.mcp.add(
      client,
      { a: 2, b: 3 },
    );
    TestValidator.equals("add.result", result.result, 5);
  } finally {
    await client.close();
  }
};
