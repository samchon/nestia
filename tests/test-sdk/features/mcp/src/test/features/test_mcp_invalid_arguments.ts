import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies invalid MCP tool arguments are rejected as JSON-RPC `InvalidParams`.
 *
 * Locks the typia validator path generated for `@McpRoute.Params()`. Without
 * this mapping, malformed model-supplied arguments could reach the controller
 * or surface as a generic internal error that clients cannot self-correct.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `add` with a string where a number is required.
 * 3. Assert the thrown MCP error code is `InvalidParams`.
 */
export const test_mcp_invalid_arguments = async (
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
        name: "add",
        arguments: { a: "not a number", b: 3 } as any,
      });
    } catch (e) {
      caught = e;
    }
    TestValidator.predicate("call rejected", caught !== null);
    TestValidator.predicate("error is McpError", caught instanceof McpError);
    TestValidator.equals(
      "error code is InvalidParams",
      (caught as McpError).code,
      ErrorCode.InvalidParams,
    );
  } finally {
    await client.close();
  }
};
