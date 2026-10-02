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
 */
export const test_api_mcp_subtract = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const result = await api.functional.mcp.subtract(client, { a: 10, b: 4 });
    TestValidator.equals("subtract.result", result.result, 6);
  } finally {
    await client.close();
  }
};
