import { TestValidator } from "@nestia/e2e";

import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies direct MCP `tools/call` requests execute transformed controller
 * methods and return JSON text content.
 *
 * Locks the runtime path from MCP request arguments through typia validation,
 * controller invocation, and JSON serialization. The generated SDK has separate
 * coverage; this test keeps the raw protocol behavior pinned.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call arithmetic and weather tools through `client.callTool`.
 * 3. Parse text content and assert representative payload fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw add/multiply/derived_override calls must decode5/6/6, and raw weather Tokyo/celsius must echo location/unit and numeric temperature.
 * @evidence contracts/testing.md#independent-expectations Authored base/derived controllers compute sum/product/difference and weather echoes its input; handwritten arithmetic literals and submitted strings establish the selected expectations independently of serialized output.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary, inherited and overridden methods contrast reflection/dispatch branches, while a nested-capable object response contrasts arithmetic. This case checks selected weather fields rather than exact temperature/conditions.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Direct official tools/call requests connect native validation, inherited controller dispatch and adaptor JSON text serialization independently of generated wrappers.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_tools_call = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
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
};
