import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies domain exceptions surface as MCP tool errors without rejecting the
 * protocol call.
 *
 * Locks the adaptor branch that converts controller `HttpException` failures
 * into `isError: true` tool results. MCP clients expect domain failures to be
 * readable model feedback rather than transport-level JSON-RPC failures.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call the `divide` tool with a zero denominator.
 * 3. Assert the response has `isError` and a readable message.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls divide over MCP with zero denominator and checks isError plus readable text mentioning zero.
 * @evidence contracts/testing.md#independent-expectations The authored calculator rejects division by zero; MCP tool failures are returned as error content rather than a transport rejection.
 * @evidence contracts/testing.md#distinguishing-cases Owns the zero-denominator error branch; tools_call owns successful arithmetic.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls divide over mcp with zero denominator and checks iserror plus readable text mentioning zero. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result: any = await client.callTool({
      name: "divide",
      arguments: { a: 10, b: 0 },
    });
    TestValidator.equals("isError flag set", result.isError, true);
    TestValidator.predicate(
      "content has text",
      Array.isArray(result.content) &&
        result.content[0]?.type === "text" &&
        typeof result.content[0].text === "string",
    );
    TestValidator.predicate(
      "message mentions division by zero",
      String(result.content[0].text).toLowerCase().includes("zero"),
    );
  } finally {
    await client.close();
  }
};
