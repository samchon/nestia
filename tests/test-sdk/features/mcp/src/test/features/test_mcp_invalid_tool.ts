import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

export const test_mcp_invalid_tool = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${connection.host}${connection.path}`),
    ),
  );
  try {
    let caught: unknown = null;
    try {
      await client.callTool({
        name: "definitely_does_not_exist",
        arguments: {},
      });
    } catch (e) {
      caught = e;
    }
    TestValidator.predicate("call rejected", caught !== null);
    TestValidator.predicate("error is McpError", caught instanceof McpError);
    TestValidator.equals(
      "error code is MethodNotFound",
      (caught as McpError).code,
      ErrorCode.MethodNotFound,
    );
  } finally {
    await client.close();
  }
};
