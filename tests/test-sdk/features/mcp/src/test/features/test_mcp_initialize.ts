import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

export const test_mcp_initialize = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`${connection.host}${connection.path}`),
  );
  await client.connect(transport);
  try {
    const version: string | undefined = client.getServerVersion()?.name;
    TestValidator.predicate("serverInfo returned", !!version);

    const caps = client.getServerCapabilities();
    TestValidator.predicate("tools capability advertised", !!caps?.tools);
  } finally {
    await client.close();
  }
};
