import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TestValidator } from "@nestia/e2e";

export interface IConnection {
  host: string;
  path: string;
}

/**
 * Verifies invalid MCP tool arguments are rejected as JSON-RPC `InvalidParams`.
 *
 * Locks the typia validator path generated for `@McpRoute.Params()`. Without
 * this mapping, malformed model-supplied arguments could reach the controller
 * or surface as a generic internal error that clients cannot self-correct.
 *
 * 1. Connect an MCP SDK client to the test transport.
 * 2. Call `add` with a string where a number is required.
 * 3. Assert the thrown MCP error code is `InvalidParams`.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw add with string a and numeric b must reject with an actual McpError whose code is InvalidParams.
 * @evidence contracts/testing.md#independent-expectations The authored numeric ICalcInput excludes a string, and the public protocol error enum establishes InvalidParams independently of current server output.
 * @evidence contracts/testing.md#distinguishing-cases A single wrong scalar type contrasts valid2/3 arguments and unknown-tool MethodNotFound. Error class/code checks reject arbitrary network/server failures as a substitute.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native parameter validation, adaptor JSON-RPC error mapping and official client decoding must connect; a validator unit alone cannot establish the protocol error class/code.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_mcp_invalid_arguments = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
    let caught: unknown = null;
    try {
      await client.callTool({
        name: "add",
        arguments: { a: "not a number", b: 3 } as any,
      });
    } catch (e) {
      caught = e;
    }
    TestValidator.predicate("call rejected", caught !== null);
    TestValidator.predicate("error is McpError", caught instanceof McpError);
    TestValidator.equals(
      "error code is InvalidParams",
      (caught as McpError).code,
      ErrorCode.InvalidParams,
    );
  } finally {
    await client.close();
  }
};
