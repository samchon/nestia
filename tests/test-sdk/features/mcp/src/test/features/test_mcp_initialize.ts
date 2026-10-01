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
 * @evidence contracts/testing.md#behavioral-verification The actual initialize handshake must provide a truthy server name and advertise tools capability.
 * @evidence contracts/testing.md#independent-expectations The authored MCP adaptor setup advertises a tools server; official client initialization exposes that protocol state. Presence checks intentionally do not certify an exact identity/version or every capability.
 * @evidence contracts/testing.md#distinguishing-cases Server identity and tools capability reject a connection that succeeds without useful initialization state. Tool list/call siblings retain actual discovery/dispatch checks.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Real official-client initialization and StreamableHTTP transport must agree with adaptor bootstrap; local server option inspection cannot certify the handshake.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
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
