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
 * @evidence contracts/testing.md#behavioral-verification Calls the generated add wrapper over MCP and checks parsed result.result equals five.
 * @evidence contracts/testing.md#independent-expectations The authored fixture defines addition, so numeric inputs two and three independently require five.
 * @evidence contracts/testing.md#distinguishing-cases Owns one successful generated arithmetic wrapper; invalid_arguments and domain_error provide protocol and wrapper failure controls.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls the generated add wrapper over mcp and checks parsed result.result equals five. No existing assertion is removed or transferred by adding its acknowledgment.
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
