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
 */
export const test_api_mcp_divide_ok = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result = await api.functional.mcp.divide(client, { a: 21, b: 3 });
    TestValidator.equals("divide.result", result.result, 7);
  } finally {
    await client.close();
  }
};
