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
 * @evidence contracts/testing.md#behavioral-verification Calls generated subtract and checks the parsed difference is six.
 * @evidence contracts/testing.md#independent-expectations Ten minus four is six under the authored arithmetic contract.
 * @evidence contracts/testing.md#distinguishing-cases Exercises a second wrapper in the shared MCP namespace, distinguishing accessor overwrite from the add-only happy path.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls generated subtract and checks the parsed difference is six. No existing assertion is removed or transferred by adding its acknowledgment.
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
