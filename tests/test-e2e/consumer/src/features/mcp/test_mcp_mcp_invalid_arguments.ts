import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies invalid MCP tool arguments are rejected as JSON-RPC `InvalidParams`.
 *
 * Locks the typia validator path generated for `@McpRoute.Params()`. Without
 * this mapping, malformed model-supplied arguments could reach the controller
 * or surface as a generic internal error that clients cannot self-correct.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call `add` with a string where a number is required.
 * 3. Assert the thrown MCP error code is `InvalidParams`.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw add with string a and numeric b must reject with an actual McpError whose code is InvalidParams. The same client must subsequently decode an add call as result5.
 * @evidence contracts/testing.md#independent-expectations The authored numeric ICalcInput excludes a string, and the public protocol error enum establishes InvalidParams independently of current server output.
 * @evidence contracts/testing.md#distinguishing-cases A single wrong scalar type contrasts valid2/3 arguments and unknown-tool MethodNotFound. Error class/code checks reject arbitrary network/server failures as a substitute. A valid call after rejection distinguishes recoverable error mapping from a poisoned shared connection.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Native parameter validation, adaptor JSON-RPC error mapping and official client decoding must connect; a validator unit alone cannot establish the protocol error class/code.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_invalid_arguments = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  let caught: unknown = null;
  try {
    await client.callTool({
      name: "add",
      arguments: { a: "not a number", b: 3 } as any,
    });
  } catch (e) {
    caught = e;
  }
  TestValidator.predicate("call rejected", caught !== null);
  TestValidator.predicate("error is McpError", caught instanceof McpError);
  TestValidator.equals(
    "error code is InvalidParams",
    (caught as McpError).code,
    ErrorCode.InvalidParams,
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
