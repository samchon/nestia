import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

import type { createMcpConnection } from "../../internal/McpConnection";

export interface IConnection {
  host: string;
  path: string;
  mcp: ReturnType<typeof createMcpConnection>["acquire"];
}

/**
 * Verifies unknown MCP tool names are rejected as JSON-RPC `MethodNotFound`.
 *
 * Locks the adaptor dispatch table built from transformed `@McpRoute` metadata.
 * A regression here would either call the wrong controller method or return an
 * unstructured error for a common client recovery case.
 *
 * 1. Use the common initialized official MCP client.
 * 2. Call a tool name that is not registered.
 * 3. Assert the thrown MCP error code is `MethodNotFound`.
 *
 * @evidence contracts/testing.md#behavioral-verification A definitely_does_not_exist raw call must reject with McpError and MethodNotFound code. The same client must subsequently decode an add call as result5.
 * @evidence contracts/testing.md#independent-expectations Authored controllers register the known tools and omit the submitted invented name; the official error enum supplies the required unknown-method code independently of implementation output.
 * @evidence contracts/testing.md#distinguishing-cases Unknown dispatch contrasts known-tool invalid arguments and known-tool domain failure. Checking the specific class/code prevents an unrelated HTTP failure satisfying rejection. A valid call after rejection distinguishes recoverable error mapping from a poisoned shared connection.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual transformed dispatch metadata, MCP adaptor and official client error decoding must connect; a local map lookup cannot prove the JSON-RPC response.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend; all compatible MCP cases reuse one client handshake.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. The consumer owns the shared official MCP client and closes it in finally after every case has settled. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_mcp_invalid_tool = async (
  connection: IConnection,
): Promise<void> => {
  const client = await connection.mcp();
  let caught: unknown = null;
  try {
    await client.callTool({
      name: "definitely_does_not_exist",
      arguments: {},
    });
  } catch (e) {
    caught = e;
  }
  TestValidator.predicate("call rejected", caught !== null);
  TestValidator.predicate("error is McpError", caught instanceof McpError);
  TestValidator.equals(
    "error code is MethodNotFound",
    (caught as McpError).code,
    ErrorCode.MethodNotFound,
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
