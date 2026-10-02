import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the MCP `tools/list` response exposes every transformed tool with
 * generated input schemas.
 *
 * This locks the runtime reflection path from transformed `@McpRoute` metadata
 * through `McpAdaptor.upgrade()`. A regression in JSDoc extraction or schema
 * injection would still compile but would leave the MCP client with incomplete
 * tool descriptions.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. List available tools through the MCP protocol.
 * 3. Assert tool names, weather description, and generated object schema.
 *
 * @evidence contracts/testing.md#behavioral-verification Lists live MCP tools and compares the exact eight names, weather description presence and object input schema.
 * @evidence contracts/testing.md#independent-expectations The authored controller decorators declare eight visible tools, with hidden and base_override replaced by derived methods; weather accepts an object.
 * @evidence contracts/testing.md#distinguishing-cases Exact name equality rejects missing, duplicate and leaked base tools; schema and description checks cover weather metadata presence only, not full schema fidelity.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still lists live mcp tools and compares the exact eight names, weather description presence and object input schema. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_mcp_tools_list = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const { tools } = await client.listTools();
    TestValidator.equals("tool count", tools.length, 8);

    const names: string[] = tools.map((t) => t.name).sort();
    TestValidator.equals("tool names", names, [
      "add",
      "derived_override",
      "divide",
      "echo_client",
      "get_weather",
      "multiply",
      "notify",
      "subtract",
    ]);

    const weather = tools.find((t) => t.name === "get_weather")!;
    TestValidator.predicate(
      "weather description present",
      !!weather.description && weather.description.length > 0,
    );
    TestValidator.predicate(
      "weather inputSchema is object",
      (weather.inputSchema as any)?.type === "object",
    );
  } finally {
    await client.close();
  }
};
