import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the generated MCP SDK wrapper calls the `subtract` tool.
 *
 * Locks generation of multiple tool wrappers in the same `mcp/index.ts` file. A
 * namespace collision or accessor ordering regression could leave only one
 * arithmetic wrapper usable even when metadata reflection succeeds.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.subtract` with typed arguments.
 * 3. Assert the parsed result is the expected difference.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated subtract with10/4 must return result6.
 * @evidence contracts/testing.md#independent-expectations Authored CalculatorController computes a-b and elementary arithmetic independently establishes6.
 * @evidence contracts/testing.md#distinguishing-cases Subtract is a distinct wrapper beside add/divide, so generating only the first arithmetic accessor cannot satisfy this case. This is a selected accepted input rather than exhaustive arithmetic semantics.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual consumer import and MCP wrapper dispatch must connect the separate subtract tool; add transport success alone cannot certify it.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_subtract = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result = await api.functional.mcp.subtract(client, { a: 10, b: 4 });
    TestValidator.equals("subtract.result", result.result, 6);
  } finally {
    await client.close();
  }
};
