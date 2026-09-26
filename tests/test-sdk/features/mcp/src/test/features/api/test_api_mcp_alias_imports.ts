import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK imports alias MCP SDK symbols when DTO names
 * collide with them.
 *
 * The generated wrapper imports `Client` and `CallToolResult` from
 * `@modelcontextprotocol/sdk`; this fixture defines DTOs with the same names.
 * Without aliasing, the generated file either fails to compile or calls the
 * wrong type in the public wrapper signature.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call the generated `echo_client` wrapper with a DTO named `Client`.
 * 3. Assert the typed output DTO named `CallToolResult` is parsed correctly.
 */
export const test_api_mcp_alias_imports = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result = await api.functional.mcp.echo_client(client, {
      name: "generated",
    });
    TestValidator.equals("echo_client.message", result.message, "generated");
  } finally {
    await client.close();
  }
};
