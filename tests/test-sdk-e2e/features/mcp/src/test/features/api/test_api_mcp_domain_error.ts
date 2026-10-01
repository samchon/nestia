import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Generated divide with10/0 must reject with an Error whose message includes Division by zero is not allowed.
 * @evidence contracts/testing.md#independent-expectations CalculatorController explicitly throws that BadRequestException literal on b0. The generated-client contract converts a raw isError tool response into rejection preserving its reason.
 * @evidence contracts/testing.md#distinguishing-cases Zero denominator contrasts the accepted21/3 wrapper sibling, and rejection must preserve the domain reason rather than any arbitrary exception. The substring permits framing around that reason.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual protocol domain-error conversion and generated wrapper rejection must connect; raw isError assertions alone cannot prove the wrapper preserves the message.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case owns its client/transport, with connection and calls covered by finally closing the client. The enhancer case also owns its extra Fastify app with listen inside finally ownership; process-local controllers/backends and copied outputs isolate other features.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_domain_error = async (
  connection: IConnection,
): Promise<void> => {
  const client = new Client({ name: "nestia-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`${connection.host}${connection.path}`),
      ),
    );
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
