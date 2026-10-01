import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "../../api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the generated MCP SDK wrapper calls the `add` tool and parses its
 * JSON result.
 *
 * Locks the happy path for `SdkMcpRouteProgrammer`: it must pass typed
 * arguments to `client.callTool`, select the text content item, and return the
 * declared primitive output shape.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.add` with typed arguments.
 * 3. Assert the parsed result matches the controller output.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated add with a2/b3 must return result5 parsed from the tool response.
 * @evidence contracts/testing.md#independent-expectations Authored CalculatorController computes a+b; elementary arithmetic establishes the literal5 independently of generated wrapper code.
 * @evidence contracts/testing.md#distinguishing-cases This successful additive wrapper contrasts separate subtract/divide and domain-error controls. One arithmetic input is not a complete numeric boundary population.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated wrapper, official MCP client, adaptor and handler must connect and decode JSON text content; a native wrapper-print unit cannot certify the request.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_api_mcp_add = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result: api.functional.mcp.add.Output = await api.functional.mcp.add(
      client,
      { a: 2, b: 3 },
    );
    TestValidator.equals("add.result", result.result, 5);
  } finally {
    await client.close();
  }
};
