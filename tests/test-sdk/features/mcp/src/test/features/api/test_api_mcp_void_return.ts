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
 * @evidence contracts/testing.md#behavioral-verification Calls generated notify and asserts the Promise resolves with undefined.
 * @evidence contracts/testing.md#independent-expectations The authored notify controller has a void return, so an empty MCP content result must not be parsed as a JSON value.
 * @evidence contracts/testing.md#distinguishing-cases Void output is the adjacent contrast to object-returning add and weather wrappers.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls generated notify and asserts the promise resolves with undefined. No existing assertion is removed or transferred by adding its acknowledgment.
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
