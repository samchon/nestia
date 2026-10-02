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
 * @evidence contracts/testing.md#behavioral-verification Calls an unregistered tool and checks a thrown McpError with MethodNotFound.
 * @evidence contracts/testing.md#independent-expectations The fixture registers named tools and excludes definitely_does_not_exist; dispatch failure must use the MCP MethodNotFound code.
 * @evidence contracts/testing.md#distinguishing-cases Owns absent-name dispatch; tools_list asserts the exact registered names and tools_call exercises successful dispatch.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls an unregistered tool and checks a thrown mcperror with methodnotfound. No existing assertion is removed or transferred by adding its acknowledgment.
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
