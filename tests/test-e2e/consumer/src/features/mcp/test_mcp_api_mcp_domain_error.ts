import { TestValidator } from "@nestia/e2e";

import api from "../../api";
import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies generated MCP SDK wrappers throw when a tool response carries
 * `isError`, with the tool's reason.
 *
 * Locks the client-side guard around MCP domain failures. The raw protocol
 * returns `isError: true` with the reason as text content; generated wrappers
 * convert that into a thrown JavaScript error carrying the reason, which they
 * once dropped (#1719).
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call `api.functional.mcp.divide` with a zero denominator.
 * 3. Assert the wrapper rejects with the tool's message.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated divide with10/0 must reject with an Error whose message includes Division by zero is not allowed. The same client must subsequently decode an add call as result5.
 * @evidence contracts/testing.md#independent-expectations CalculatorController explicitly throws that BadRequestException literal on b0. The generated-client contract converts a raw isError tool response into rejection preserving its reason.
 * @evidence contracts/testing.md#distinguishing-cases Zero denominator contrasts the accepted21/3 wrapper sibling, and rejection must preserve the domain reason rather than any arbitrary exception. The substring permits framing around that reason. A valid call after rejection distinguishes recoverable error mapping from a poisoned shared connection.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual protocol domain-error conversion and generated wrapper rejection must connect; raw isError assertions alone cannot prove the wrapper preserves the message.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  const error: unknown = await api.functional.mcp
    .divide(client, { a: 10, b: 0 })
    .then(
      () => null,
      (exp) => exp,
    );
  TestValidator.predicate(
    `divide by zero rejects with the tool's reason: ${String(error)}`,
    error instanceof Error &&
      error.message.includes("Division by zero is not allowed."),
  );
  const recovered: any = await client.callTool({
    name: "add",
    arguments: { a: 2, b: 3 },
  });
  TestValidator.equals(
    "shared client recovers after rejection",
    JSON.parse(recovered.content[0].text).result,
    5,
  );
};
