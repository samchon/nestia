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
 */
export const test_mcp_tools_list = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
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
