import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "../../api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Generated get_weather accepts Tokyo/fahrenheit and nested coordinates, echoes location/unit and returns numeric temperature/string conditions.
 * @evidence contracts/testing.md#independent-expectations WeatherController explicitly echoes location/unit and declares numeric/string fields. The case uses exact echoes and type-only output checks; it does not independently assert the handler literals72/sunny.
 * @evidence contracts/testing.md#distinguishing-cases Present optional nested coordinates and nondefault fahrenheit contrast flat arithmetic and the raw celsius call sibling. The response does not echo coordinates, so this does not certify their exact consumed values.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual native nested metadata, generated argument signature and MCP JSON serialization must connect; a local weather DTO shape alone cannot establish the request.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_weather_nested = async (
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
