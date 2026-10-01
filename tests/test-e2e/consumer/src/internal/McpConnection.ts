import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Owns one lazy official MCP client for compatible stateless consumer cases.
 *
 * Connection failures remain case failures without preventing HTTP discovery.
 * The caller closes this owner after all discovered requests have settled.
 *
 * @evidence contracts/common.md#principled-implementation The official client performs its actual initialize handshake once against an immutable URL and identity. Cases retain raw and generated call assertions; the stateless server still creates a transport per HTTP request.
 * @evidence contracts/common.md#clear-and-simple-design One promise shares acquisition, one retained client enables cleanup after partial connection failure, and the caller owns one close at the end of discovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only public client and transport APIs are used; no framework global, protocol method or foreign lifecycle is replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment records lazy acquisition, failure isolation and the end of the shared client's lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Client acquisition is constant per consumer lifetime; each call retains its own request cost without repeated handshake preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work All thirteen authored cases use identical URL, identity, headers and stateless handlers. Successful and rejected calls share the same official client; error cases also verify a subsequent valid call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one client and acquisition promise are retained. The client is assigned before connect so a rejected handshake remains closable; caller finally closes after all cases settle.
 */
export const createMcpConnection = (host: string, path: string) => {
  let client: Client | undefined;
  let acquisition: Promise<Client> | undefined;
  return {
    acquire: (): Promise<Client> => {
      if (acquisition === undefined)
        acquisition = (async () => {
          client = new Client({ name: "nestia-test", version: "1.0.0" });
          await client.connect(
            new StreamableHTTPClientTransport(new URL(`${host}${path}`)),
          );
          return client;
        })();
      return acquisition;
    },
    close: async (): Promise<void> => {
      if (client !== undefined) await client.close();
    },
  };
};
