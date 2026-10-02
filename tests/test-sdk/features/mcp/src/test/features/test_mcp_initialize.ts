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
 *
 * @evidence contracts/testing.md#behavioral-verification Connects a real MCP client and checks initialized server identity and the advertised tools capability.
 * @evidence contracts/testing.md#independent-expectations The MCP handshake exposes serverInfo and capability declarations; both must be present for this tool server.
 * @evidence contracts/testing.md#distinguishing-cases Owns bootstrap capability presence; tools_list and tools_call independently exercise the advertised operations.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still connects a real mcp client and checks initialized server identity and the advertised tools capability. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_mcp_initialize = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`${connection.host}${connection.path}`),
  );
  try {
    await client.connect(transport);
    const version: string | undefined = client.getServerVersion()?.name;
    TestValidator.predicate("serverInfo returned", !!version);

    const caps = client.getServerCapabilities();
    TestValidator.predicate("tools capability advertised", !!caps?.tools);
  } finally {
    await client.close();
  }
};
