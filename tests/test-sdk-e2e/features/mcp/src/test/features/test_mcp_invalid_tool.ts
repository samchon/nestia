import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies unknown MCP tool names are rejected as JSON-RPC `MethodNotFound`.
 *
 * Locks the adaptor dispatch table built from transformed `@McpRoute` metadata.
 * A regression here would either call the wrong controller method or return an
 * unstructured error for a common client recovery case.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call a tool name that is not registered.
 * 3. Assert the thrown MCP error code is `MethodNotFound`.
 *
 * @evidence contracts/testing.md#behavioral-verification A definitely_does_not_exist raw call must reject with McpError and MethodNotFound code.
 * @evidence contracts/testing.md#independent-expectations Authored controllers register the known tools and omit the submitted invented name; the official error enum supplies the required unknown-method code independently of implementation output.
 * @evidence contracts/testing.md#distinguishing-cases Unknown dispatch contrasts known-tool invalid arguments and known-tool domain failure. Checking the specific class/code prevents an unrelated HTTP failure satisfying rejection.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual transformed dispatch metadata, MCP adaptor and official client error decoding must connect; a local map lookup cannot prove the JSON-RPC response.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_invalid_tool = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    let caught: unknown = null;
    try {
      await client.callTool({
        name: "definitely_does_not_exist",
        arguments: {},
      });
    } catch (e) {
      caught = e;
    }
    TestValidator.predicate("call rejected", caught !== null);
    TestValidator.predicate("error is McpError", caught instanceof McpError);
    TestValidator.equals(
      "error code is MethodNotFound",
      (caught as McpError).code,
      ErrorCode.MethodNotFound,
    );
  } finally {
    await client.close();
  }
};
