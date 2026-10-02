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
 */
export const test_mcp_invalid_tool = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
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
