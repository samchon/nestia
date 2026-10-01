import { TestValidator } from "@nestia/e2e";

import api from "../../api";
import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies the generated MCP SDK wrapper handles a successful division result.
 *
 * Locks a non-additive arithmetic route so SDK generation is not accidentally
 * tailored to the first tool only. It also exercises reuse of the same input
 * and output DTO aliases across multiple MCP wrappers.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call `api.functional.mcp.divide` with a non-zero denominator.
 * 3. Assert the parsed result is the expected quotient.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated divide with21/3 must return result7.
 * @evidence contracts/testing.md#independent-expectations Authored CalculatorController computes a/b and the independent arithmetic quotient is7.
 * @evidence contracts/testing.md#distinguishing-cases A nonzero accepted denominator contrasts the separate zero-denominator domain rejection using the same wrapper. This one quotient does not certify numeric overflow or all floating-point values.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated divide wrapper and MCP transport must parse the handler response; successful add alone cannot prove this separately generated accessor.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_divide_ok = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const result = await api.functional.mcp.divide(client, { a: 21, b: 3 });
  TestValidator.equals("divide.result", result.result, 7);
};
