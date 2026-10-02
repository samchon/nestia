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
 * @evidence contracts/testing.md#behavioral-verification Calls the generated divide wrapper and asserts quotient seven for twenty-one divided by three.
 * @evidence contracts/testing.md#independent-expectations Ordinary division of twenty-one by three is seven, independently of the generated wrapper implementation.
 * @evidence contracts/testing.md#distinguishing-cases Nonzero denominator is the positive twin of test_api_mcp_domain_error; this wrapper also shares DTO definitions with add and subtract.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls the generated divide wrapper and asserts quotient seven for twenty-one divided by three. No existing assertion is removed or transferred by adding its acknowledgment.
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
