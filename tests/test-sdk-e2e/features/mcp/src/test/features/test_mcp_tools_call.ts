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
 * @evidence contracts/testing.md#behavioral-verification Raw add/multiply/derived_override calls must decode5/6/6, and raw weather Tokyo/celsius must echo location/unit and numeric temperature.
 * @evidence contracts/testing.md#independent-expectations Authored base/derived controllers compute sum/product/difference and weather echoes its input; handwritten arithmetic literals and submitted strings establish the selected expectations independently of serialized output.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary, inherited and overridden methods contrast reflection/dispatch branches, while a nested-capable object response contrasts arithmetic. This case checks selected weather fields rather than exact temperature/conditions.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Direct official tools/call requests connect native validation, inherited controller dispatch and adaptor JSON text serialization independently of generated wrappers.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
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
