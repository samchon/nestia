import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "../../../api";

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
