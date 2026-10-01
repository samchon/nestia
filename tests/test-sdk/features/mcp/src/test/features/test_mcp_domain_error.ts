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
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Official client.callTool must observe real adaptor domain-error encoding over HTTP; generated wrapper rejection alone cannot prove the raw protocol remains a resolved tool result.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
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
