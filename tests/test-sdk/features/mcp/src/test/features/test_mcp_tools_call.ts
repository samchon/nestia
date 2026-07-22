import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies direct MCP `tools/call` requests execute transformed controller
 * methods and return JSON text content.
 *
 * Locks the runtime path from MCP request arguments through typia validation,
 * controller invocation, and JSON serialization. The generated SDK has separate
 * coverage; this test keeps the raw protocol behavior pinned.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call arithmetic and weather tools through `client.callTool`.
 * 3. Parse text content and assert representative payload fields.
 */
export const test_mcp_tools_call = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const addResult: any = await client.callTool({
      name: "add",
      arguments: { a: 2, b: 3 },
    });
    TestValidator.predicate(
      "add returned content",
      Array.isArray(addResult.content) && addResult.content.length > 0,
    );
    const addPayload = JSON.parse(addResult.content[0].text);
    TestValidator.equals("add result", addPayload.result, 5);

    const multiplyResult: any = await client.callTool({
      name: "multiply",
      arguments: { a: 2, b: 3 },
    });
    const multiplyPayload = JSON.parse(multiplyResult.content[0].text);
    TestValidator.equals("multiply result", multiplyPayload.result, 6);

    const weatherResult: any = await client.callTool({
      name: "get_weather",
      arguments: { location: "Tokyo", unit: "celsius" },
    });
    const weatherPayload = JSON.parse(weatherResult.content[0].text);
    TestValidator.equals("weather location", weatherPayload.location, "Tokyo");
    TestValidator.equals("weather unit", weatherPayload.unit, "celsius");
    TestValidator.predicate(
      "weather temp is number",
      typeof weatherPayload.temperature === "number",
    );
  } finally {
    await client.close();
  }
};
