import { TestValidator } from "@nestia/e2e";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface IConnection {
  host: string;
  path: string;
}

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

    const weatherResult: any = await client.callTool({
      name: "get_weather",
      arguments: { location: "Tokyo", unit: "celsius" },
    });
    const weatherPayload = JSON.parse(weatherResult.content[0].text);
    TestValidator.equals(
      "weather location",
      weatherPayload.location,
      "Tokyo",
    );
    TestValidator.equals("weather unit", weatherPayload.unit, "celsius");
    TestValidator.predicate(
      "weather temp is number",
      typeof weatherPayload.temperature === "number",
    );
  } finally {
    await client.close();
  }
};
