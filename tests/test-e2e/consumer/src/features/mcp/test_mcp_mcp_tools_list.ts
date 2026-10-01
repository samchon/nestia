import { TestValidator } from "@nestia/e2e";

import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies the MCP `tools/list` response exposes every transformed tool with
 * generated input schemas.
 *
 * This locks the runtime reflection path from transformed `@McpRoute` metadata
 * through `McpAdaptor.upgrade()`. A regression in JSDoc extraction or schema
 * injection would still compile but would leave the MCP client with incomplete
 * tool descriptions.
 *
 * 1. Use the common initialized official MCP client.
 * 2. List available tools through the MCP protocol.
 * 3. Assert tool names, weather description, and generated object schema.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw tools/list must return exactly eight handwritten sorted names, with a nonempty weather description and object inputSchema.
 * @evidence contracts/testing.md#independent-expectations Authored ordinary/base/derived McpRoute declarations establish eight visible names; undecorated hidden override and replaced base_override must be absent. DTO input object shape independently requires object schema.
 * @evidence contracts/testing.md#distinguishing-cases Visible inheritance/derived replacement and hidden override contrast inclusion semantics. Exact count/names reject empty/duplicate discovery; description/schema presence does not independently certify all nested properties.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual native metadata and MCP adaptor discovery must be exposed through official tools/list; generated wrapper metadata alone cannot prove the live server list.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_tools_list = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const { tools } = await client.listTools();
  TestValidator.equals("tool count", tools.length, 8);

  const names: string[] = tools.map((t) => t.name).sort();
  TestValidator.equals("tool names", names, [
    "add",
    "derived_override",
    "divide",
    "echo_client",
    "get_weather",
    "multiply",
    "notify",
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
};
