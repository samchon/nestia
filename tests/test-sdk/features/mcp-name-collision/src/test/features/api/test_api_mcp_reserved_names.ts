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
 * (#1647). The wrapper's identifiers now yield to the tool name.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call each wrapper and assert the tool it reached echoes the message.
 */
export const test_api_mcp_reserved_names = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    const mcp = api.functional.mcp;
    for (const [name, call] of [
      ["client", mcp.client],
      ["args", mcp.args],
      ["raw", mcp.raw],
      ["result", mcp.result],
      ["first", mcp.first],
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
