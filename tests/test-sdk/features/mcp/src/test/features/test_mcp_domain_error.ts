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
 */
export const test_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
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
