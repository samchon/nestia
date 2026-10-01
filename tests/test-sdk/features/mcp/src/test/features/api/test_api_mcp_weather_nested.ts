import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Generated get_weather accepts Tokyo/fahrenheit and nested coordinates, echoes location/unit and returns numeric temperature/string conditions.
 * @evidence contracts/testing.md#independent-expectations WeatherController explicitly echoes location/unit and declares numeric/string fields. The case uses exact echoes and type-only output checks; it does not independently assert the handler literals72/sunny.
 * @evidence contracts/testing.md#distinguishing-cases Present optional nested coordinates and nondefault fahrenheit contrast flat arithmetic and the raw celsius call sibling. The response does not echo coordinates, so this does not certify their exact consumed values.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native nested metadata, generated argument signature and MCP JSON serialization must connect; a local weather DTO shape alone cannot establish the request.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
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
