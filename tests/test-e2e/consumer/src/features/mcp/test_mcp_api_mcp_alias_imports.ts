import { TestValidator } from "@nestia/e2e";

import api from "../../api";
import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies generated MCP SDK imports alias MCP SDK symbols when DTO names
 * collide with them.
 *
 * The generated wrapper imports `Client` and `CallToolResult` from
 * `@modelcontextprotocol/sdk`; this fixture defines DTOs with the same names.
 * Without aliasing, the generated file either fails to compile or calls the
 * wrong type in the public wrapper signature.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call the generated `echo_client` wrapper with a DTO named `Client`.
 * 3. Assert the typed output DTO named `CallToolResult` is parsed correctly.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated echo_client must compile with DTOs named Client/CallToolResult and return exact message generated.
 * @evidence contracts/testing.md#independent-expectations ImportAliasController returns params.name as message; the authored DTO names intentionally coincide with official client/protocol type names and establish the collision independently of generated aliases.
 * @evidence contracts/testing.md#distinguishing-cases Input Client and output CallToolResult contrast two import roles with actual official client construction. Exact echo certifies the selected payload, not every possible colliding DTO name.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated consumer typechecking and MCP call must coexist with official SDK symbols; an alias-string snapshot cannot prove their bindings work.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_alias_imports = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const result = await api.functional.mcp.echo_client(client, {
    name: "generated",
  });
  TestValidator.equals("echo_client.message", result.message, "generated");
};
