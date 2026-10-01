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
 * @evidence contracts/testing.md#behavioral-verification Raw divide10/0 must resolve as a tool result with isError true and a first text item whose message mentions zero.
 * @evidence contracts/testing.md#independent-expectations CalculatorController deliberately throws a division-by-zero BadRequestException; the adaptor contract exposes a readable tool domain failure rather than JSON-RPC transport rejection.
 * @evidence contracts/testing.md#distinguishing-cases A valid argument shape that fails in the domain contrasts invalid-argument protocol rejection. The lowercase zero substring checks a readable selected reason, not an exact complete message.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Official client.callTool must observe real adaptor domain-error encoding over HTTP; generated wrapper rejection alone cannot prove the raw protocol remains a resolved tool result.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_domain_error = async (
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
