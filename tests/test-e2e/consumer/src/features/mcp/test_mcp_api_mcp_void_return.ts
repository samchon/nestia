import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "../../api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK wrappers handle void tool results as
 * `Promise<void>`.
 *
 * MCP represents no-content tool results with an empty `content` array. The
 * generated wrapper must not try to parse the first text item when the
 * controller return type is `void`.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call the generated `notify` wrapper, whose controller returns `void`.
 * 3. Assert the wrapper resolves to `undefined`.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated notify with an explicit message must resolve with exactly undefined.
 * @evidence contracts/testing.md#independent-expectations CalculatorController declares Promise<void> and the adaptor represents a void tool result with no content; the generated wrapper contract must avoid parsing a nonexistent text item.
 * @evidence contracts/testing.md#distinguishing-cases Bodyless notify contrasts JSON-text arithmetic/object output wrappers. Exact undefined detects a spurious object or parse failure without asserting notification persistence.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual adaptor content encoding and generated void wrapper decoding must interoperate over MCP; a void type identity cannot prove the empty-content path.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_void_return = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result: api.functional.mcp.notify.Output =
      await api.functional.mcp.notify(client, { message: "generated" });
    TestValidator.equals("notify output", result, undefined);
  } finally {
    await client.close();
  }
};
