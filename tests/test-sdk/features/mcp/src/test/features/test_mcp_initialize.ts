import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the MCP initialize handshake advertises server identity and tool
 * capabilities.
 *
 * Locks the adaptor bootstrap path that wires `McpServer` with stateless
 * Streamable HTTP transport. If capabilities are omitted, clients can connect
 * but will not know that `tools/list` and `tools/call` are available.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Read the initialized server version.
 * 3. Assert the tools capability is present.
 */
export const test_mcp_initialize = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`${connection.host}${connection.path}`),
  );
  await client.connect(transport);
  try {
    const version: string | undefined = client.getServerVersion()?.name;
    TestValidator.predicate("serverInfo returned", !!version);

    const caps = client.getServerCapabilities();
    TestValidator.predicate("tools capability advertised", !!caps?.tools);
  } finally {
    await client.close();
  }
};
