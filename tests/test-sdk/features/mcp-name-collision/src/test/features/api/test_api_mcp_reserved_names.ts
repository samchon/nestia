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
 * @evidence contracts/testing.md#behavioral-verification Calls six generated wrappers whose names collide with parameters, locals or JSON and asserts distinct echoed name prefixes.
 * @evidence contracts/testing.md#independent-expectations Each authored reserved-name tool returns its own name followed by the input message; six literal prefixes distinguish wrong dispatch and shadowed identifiers.
 * @evidence contracts/testing.md#distinguishing-cases Covers client, args, raw, result, first and JSON collisions; the ordinary MCP fixture covers names without wrapper-identifier collisions.
 * @evidence contracts/testing.md#execution-ownership The mcp-name-collision feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp-name-collision harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp-name-collision controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls six generated wrappers whose names collide with parameters, locals or json and asserts distinct echoed name prefixes. No existing assertion is removed or transferred by adding its acknowledgment.
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
