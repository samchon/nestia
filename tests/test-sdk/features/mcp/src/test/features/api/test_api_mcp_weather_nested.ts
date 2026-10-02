import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK wrappers handle nested object arguments and object
 * outputs.
 *
 * Locks nested JSON schema generation and the generated wrapper's JSON parse
 * path for non-trivial DTOs. Flat arithmetic DTOs would not catch regressions
 * in nested parameter metadata or output typing.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.get_weather` with nested coordinates.
 * 3. Assert selected nested-route output fields are parsed correctly.
 */
export const test_api_mcp_weather_nested = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result = await api.functional.mcp.get_weather(client, {
      location: "Tokyo",
      unit: "fahrenheit",
      coords: { lat: 35.68, lng: 139.76 },
    });
    TestValidator.equals("weather.location", result.location, "Tokyo");
    TestValidator.equals("weather.unit", result.unit, "fahrenheit");
    TestValidator.equals("weather.temperature", result.temperature, 72);
    TestValidator.equals("weather.conditions", result.conditions, "sunny");
    const invalid: unknown = await api.functional.mcp
      .get_weather(client, {
        location: "Tokyo",
        coords: { lat: "invalid", lng: 139.76 } as any,
      })
      .then(
        () => null,
        (error) => error,
      );
    TestValidator.predicate(
      "nested coordinate validation",
      invalid instanceof McpError && invalid.code === ErrorCode.InvalidParams,
    );
  } finally {
    await client.close();
  }
};
