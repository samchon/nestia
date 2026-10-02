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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls add, inherited multiply, derived_override and weather via raw client.callTool and asserts parsed text payloads.
 * @evidence contracts/testing.md#independent-expectations Authored arithmetic gives 2+3=5, 2*3=6 and 9-3=6; weather echoes location and selected unit.
 * @evidence contracts/testing.md#distinguishing-cases Covers base-method inheritance, derived metadata override and ordinary weather success; invalid arguments and domain errors have separate cases.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls add, inherited multiply, derived_override and weather via raw client.calltool and asserts parsed text payloads. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_mcp_tools_call = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
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

    const overrideResult: any = await client.callTool({
      name: "derived_override",
      arguments: { a: 9, b: 3 },
    });
    const overridePayload = JSON.parse(overrideResult.content[0].text);
    TestValidator.equals("derived override result", overridePayload.result, 6);

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
