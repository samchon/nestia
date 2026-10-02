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
 * @evidence contracts/testing.md#behavioral-verification Calls generated echo_client with a DTO named Client and checks output message after compiling a DTO named CallToolResult.
 * @evidence contracts/testing.md#independent-expectations The authored echo controller copies input.name into output.message; compilation must distinguish DTO names from MCP SDK imports.
 * @evidence contracts/testing.md#distinguishing-cases Colliding imported Client and CallToolResult are the distinguishing fixture inputs; ordinary add covers noncolliding generated types.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Exercises the generated SDK wrapper, MCP SDK client and live Nest transport; direct arithmetic or schema calls cannot detect broken connection or dispatch assembly.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The mcp controllers use authored request inputs rather than persisted records. Clients close in finally, including failed connections; the fixture entry closes its shared backend.
 * @evidence contracts/e2e.md#preserved-coverage This case still calls generated echo_client with a dto named client and checks output message after compiling a dto named calltoolresult. No existing assertion is removed or transferred by adding its acknowledgment.
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
