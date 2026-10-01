import { TestValidator } from "@nestia/e2e";

import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies the MCP initialize handshake advertises server identity and tool
 * capabilities.
 *
 * Locks the adaptor bootstrap path that wires `McpServer` with stateless
 * Streamable HTTP transport. If capabilities are omitted, clients can connect
 * but will not know that `tools/list` and `tools/call` are available.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Read the initialized server version.
 * 3. Assert the tools capability is present.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual initialize handshake must provide a truthy server name and advertise tools capability.
 * @evidence contracts/testing.md#independent-expectations The authored MCP adaptor setup advertises a tools server; official client initialization exposes that protocol state. Presence checks intentionally do not certify an exact identity/version or every capability.
 * @evidence contracts/testing.md#distinguishing-cases Server identity and tools capability reject a connection that succeeds without useful initialization state. Tool list/call siblings retain actual discovery/dispatch checks.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Real official-client initialization and StreamableHTTP transport must agree with adaptor bootstrap; local server option inspection cannot certify the handshake.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_initialize = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const version: string | undefined = client.getServerVersion()?.name;
  TestValidator.predicate("serverInfo returned", !!version);

  const caps = client.getServerCapabilities();
  TestValidator.predicate("tools capability advertised", !!caps?.tools);
};
