import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

export const test_api_mcp_weather_nested = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result = await api.functional.mcp.get_weather(client, {
      location: "Tokyo",
      unit: "fahrenheit",
      coords: { lat: 35.68, lng: 139.76 },
    });
    TestValidator.equals("weather.location", result.location, "Tokyo");
    TestValidator.equals("weather.unit", result.unit, "fahrenheit");
    TestValidator.predicate(
      "weather.temperature is number",
      typeof result.temperature === "number",
    );
    TestValidator.predicate(
      "weather.conditions is string",
      typeof result.conditions === "string",
    );
  } finally {
    await client.close();
  }
};
