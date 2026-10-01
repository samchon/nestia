import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated wrapper, official MCP client, adaptor and handler must connect and decode JSON text content; a native wrapper-print unit cannot certify the request.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_add = async (
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
