import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies the generated MCP SDK wrapper handles a successful division result.
 *
 * Locks a non-additive arithmetic route so SDK generation is not accidentally
 * tailored to the first tool only. It also exercises reuse of the same input
 * and output DTO aliases across multiple MCP wrappers.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.divide` with a non-zero denominator.
 * 3. Assert the parsed result is the expected quotient.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated divide with21/3 must return result7.
 * @evidence contracts/testing.md#independent-expectations Authored CalculatorController computes a/b and the independent arithmetic quotient is7.
 * @evidence contracts/testing.md#distinguishing-cases A nonzero accepted denominator contrasts the separate zero-denominator domain rejection using the same wrapper. This one quotient does not certify numeric overflow or all floating-point values.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated divide wrapper and MCP transport must parse the handler response; successful add alone cannot prove this separately generated accessor.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_divide_ok = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result = await api.functional.mcp.divide(client, { a: 21, b: 3 });
    TestValidator.equals("divide.result", result.result, 7);
  } finally {
    await client.close();
  }
};
