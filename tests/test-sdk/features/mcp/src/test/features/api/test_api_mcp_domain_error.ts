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
 * `isError`.
 *
 * Locks the client-side guard around MCP domain failures. The raw protocol
 * returns `isError: true`; generated wrappers should convert that into a thrown
 * JavaScript error for ordinary SDK consumers.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `api.functional.mcp.divide` with a zero denominator.
 * 3. Assert the wrapper rejects.
 */
export const test_api_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    await TestValidator.error(
      "divide by zero surfaces as thrown Error from SDK wrapper",
      () => api.functional.mcp.divide(client, { a: 10, b: 0 }),
    );
  } finally {
    await client.close();
  }
};
