import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies MCP SDK wrappers of tools named after the wrapper's own identifiers
 * compile and call their tools.
 *
 * The wrapper declares `client` and `args` parameters and `raw`, `result`, and
 * `first` locals, and reads its tool name from `<tool>.METADATA` beside or
 * after them. A tool of one of those names therefore read its own parameter or
 * a local still in its temporal dead zone, and the SDK failed to compile
 * (#1647). The wrapper's identifiers now yield to the tool name. A tool named
 * `JSON`, a global the wrapper calls, is declared under a local name and
 * exported as itself.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call each wrapper and assert the tool it reached echoes the message.
 *
 * @evidence contracts/testing.md#behavioral-verification All six generated wrappers named client/args/raw/result/first/JSON must compile and return the exact name:m echo for submitted m.
 * @evidence contracts/testing.md#independent-expectations The authored reserved-name controllers echo their own tool name followed by the submitted message. Handwritten names and exact echoes establish which tool ran independently of generated local identifier choices.
 * @evidence contracts/testing.md#distinguishing-cases Five wrapper-local identifiers and the JSON global contrast local/parameter/global shadowing. Every wrapper must remain callable; this test does not inspect all emitted binding spellings.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual consumer compilation and MCP transport calls connect collision-safe bindings to the intended handlers; metadata inspection alone cannot prove runtime dispatch.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_reserved_names = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const mcp = api.functional.mcp;
    for (const [name, call] of [
      ["client", mcp.client],
      ["args", mcp.args],
      ["raw", mcp.raw],
      ["result", mcp.result],
      ["first", mcp.first],
      ["JSON", mcp.JSON],
    ] as const)
      TestValidator.equals(
        name,
        (await call(client, { message: "m" })).message,
        `${name}:m`,
      );
  } finally {
    await client.close();
  }
};
