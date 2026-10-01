import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies generated MCP SDK imports alias MCP SDK symbols when DTO names
 * collide with them.
 *
 * The generated wrapper imports `Client` and `CallToolResult` from
 * `@modelcontextprotocol/sdk`; this fixture defines DTOs with the same names.
 * Without aliasing, the generated file either fails to compile or calls the
 * wrong type in the public wrapper signature.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call the generated `echo_client` wrapper with a DTO named `Client`.
 * 3. Assert the typed output DTO named `CallToolResult` is parsed correctly.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated echo_client must compile with DTOs named Client/CallToolResult and return exact message generated.
 * @evidence contracts/testing.md#independent-expectations ImportAliasController returns params.name as message; the authored DTO names intentionally coincide with official client/protocol type names and establish the collision independently of generated aliases.
 * @evidence contracts/testing.md#distinguishing-cases Input Client and output CallToolResult contrast two import roles with actual official client construction. Exact echo certifies the selected payload, not every possible colliding DTO name.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated consumer typechecking and MCP call must coexist with official SDK symbols; an alias-string snapshot cannot prove their bindings work.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_alias_imports = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    const result = await api.functional.mcp.echo_client(client, {
      name: "generated",
    });
    TestValidator.equals("echo_client.message", result.message, "generated");
  } finally {
    await client.close();
  }
};
