import { TestValidator } from "@nestia/e2e";

import api from "../../api";
import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies the generated MCP SDK wrapper calls the `subtract` tool.
 *
 * Locks generation of multiple tool wrappers in the same `mcp/index.ts` file. A
 * namespace collision or accessor ordering regression could leave only one
 * arithmetic wrapper usable even when metadata reflection succeeds.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call `api.functional.mcp.subtract` with typed arguments.
 * 3. Assert the parsed result is the expected difference.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated subtract with10/4 must return result6.
 * @evidence contracts/testing.md#independent-expectations Authored CalculatorController computes a-b and elementary arithmetic independently establishes6.
 * @evidence contracts/testing.md#distinguishing-cases Subtract is a distinct wrapper beside add/divide, so generating only the first arithmetic accessor cannot satisfy this case. This is a selected accepted input rather than exhaustive arithmetic semantics.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual consumer import and MCP wrapper dispatch must connect the separate subtract tool; add transport success alone cannot certify it.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_subtract = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const result = await api.functional.mcp.subtract(client, { a: 10, b: 4 });
  TestValidator.equals("subtract.result", result.result, 6);
};
