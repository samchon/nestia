import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK wrappers throw when a tool response carries
 * `isError`, with the tool's reason.
 *
 * Locks the client-side guard around MCP domain failures. The raw protocol
 * returns `isError: true` with the reason as text content; generated wrappers
 * convert that into a thrown JavaScript error carrying the reason, which they
 * once dropped (#1719).
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.divide` with a zero denominator.
 * 3. Assert the wrapper rejects with the tool's message.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generated divide with denominator zero and asserts rejection preserves the authored domain-error message.
 * @evidence contracts/testing.md#independent-expectations The calculator explicitly rejects zero division with Division by zero is not allowed.; generated wrappers must surface that tool error as an Error.
 * @evidence contracts/testing.md#distinguishing-cases Owns wrapper conversion of isError into a rejected Error with reason; divide_ok and raw test_mcp_domain_error are the successful and protocol controls.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls generated divide with denominator zero and asserts rejection preserves the authored domain-error message. No existing assertion is removed or transferred by adding its acknowledgment.
 */
export const test_api_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const error: unknown = await api.functional.mcp
      .divide(client, { a: 10, b: 0 })
      .then(
        () => null,
        (exp) => exp,
      );
    TestValidator.predicate(
      `divide by zero rejects with the tool's reason: ${String(error)}`,
      error instanceof Error &&
        error.message.includes("Division by zero is not allowed."),
    );
  } finally {
    await client.close();
  }
};
