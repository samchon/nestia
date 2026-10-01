import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual adaptor content encoding and generated void wrapper decoding must interoperate over MCP; a void type identity cannot prove the empty-content path.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_void_return = async (
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
