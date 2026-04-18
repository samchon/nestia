import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

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
    TestValidator.equals("tool count", tools.length, 4);

    const names: string[] = tools.map((t) => t.name).sort();
    TestValidator.equals("tool names", names, [
      "add",
      "divide",
      "get_weather",
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
