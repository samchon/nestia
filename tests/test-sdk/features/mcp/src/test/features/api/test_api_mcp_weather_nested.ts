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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generated weather with nested coordinates and checks echoed location/unit, literal weather fields and rejection of a string latitude.
 * @evidence contracts/testing.md#independent-expectations The authored weather controller echoes location and unit and returns 72 for fahrenheit and sunny conditions; a latitude must be numeric.
 * @evidence contracts/testing.md#distinguishing-cases Owns numeric nested input acceptance, adjacent string-latitude rejection and object-result parsing; flat arithmetic inputs and raw weather call are complementary controls.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls generated weather with nested coordinates and checks echoed location/unit, literal weather fields and rejection of a string latitude. No existing assertion is removed or transferred by adding its acknowledgment.
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
