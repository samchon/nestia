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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls add with a string operand and checks a thrown McpError with InvalidParams.
 * @evidence contracts/testing.md#independent-expectations The authored add input requires numeric a and b; the MCP InvalidParams code identifies malformed tool arguments.
 * @evidence contracts/testing.md#distinguishing-cases String a is the negative twin of numeric arguments in tools_call and test_api_mcp_add.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls add with a string operand and checks a thrown mcperror with invalidparams. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_mcp_invalid_arguments = async (
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
