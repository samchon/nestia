import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies generated MCP SDK metadata preserves tool names and JSDoc
 * descriptions.
 *
 * The native transformer rewrites `@McpRoute("name")` into runtime metadata
 * using method JSDoc for descriptions. SDK generation must carry that reflected
 * metadata into `METADATA` constants for client-side discovery.
 *
 * 1. Read each generated MCP wrapper namespace's `METADATA`.
 * 2. Assert protocol, tool names, and selected descriptions.
 * 3. Assert all expected tools are represented exactly once.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated add protocol/tool/description and selected divide/echo_client/notify names/descriptions must match authored literals; weather description must be nonempty and the six selected tool names exactly match the handwritten sorted list.
 * @evidence contracts/testing.md#independent-expectations McpRoute names and controller method JSDoc supply the exact metadata literals independently of the emitted module. Weather uses a presence oracle instead of an exact description.
 * @evidence contracts/testing.md#distinguishing-cases Arithmetic, alias DTO, void and nested-weather tools contrast metadata forms. The six-item list counts those selected wrappers, not the entire generated namespace including inherited tools.
 * @evidence contracts/testing.md#execution-ownership Its matching exported case is discovered and awaited by the actual feature executor after generation and consumer compilation. Assertion/protocol mismatches reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native reflection and SDK printing must expose final METADATA constants to a compiling consumer; controller decorators alone cannot certify those exported values.
 * @evidence contracts/e2e.md#shared-execution One packed dependency installation and compatible producer/runtime compilations are shared. These assertions reuse the feature backend; independently connected official clients delimit each protocol state and close after that case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Metadata reads are immutable within the isolated generated feature. The entry owns backend closure and the harness removes its own copied artifacts after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All original protocol calls, wrapper inputs, exact payload/error controls and metadata/name assertions remain. Shared installation/compiler preparation preserves raw protocol and generated-wrapper owners as distinct connections.
 */
export const test_api_mcp_metadata = (): void => {
  TestValidator.equals(
    "add METADATA.protocol",
    api.functional.mcp.add.METADATA.protocol,
    "mcp",
  );
  TestValidator.equals(
    "add METADATA.tool",
    api.functional.mcp.add.METADATA.tool,
    "add",
  );
  TestValidator.equals(
    "add METADATA.description",
    api.functional.mcp.add.METADATA.description,
    "Return the sum of two numbers.",
  );

  TestValidator.equals(
    "divide METADATA.tool",
    api.functional.mcp.divide.METADATA.tool,
    "divide",
  );
  TestValidator.equals(
    "divide METADATA.description",
    api.functional.mcp.divide.METADATA.description,
    "Return a / b. Throws on division by zero.",
  );

  TestValidator.equals(
    "echo_client METADATA.tool",
    api.functional.mcp.echo_client.METADATA.tool,
    "echo_client",
  );
  TestValidator.equals(
    "echo_client METADATA.description",
    api.functional.mcp.echo_client.METADATA.description,
    "Echo a client-like DTO to exercise generated import aliasing.",
  );

  TestValidator.equals(
    "notify METADATA.tool",
    api.functional.mcp.notify.METADATA.tool,
    "notify",
  );
  TestValidator.equals(
    "notify METADATA.description",
    api.functional.mcp.notify.METADATA.description,
    "Accept a notification without returning content.",
  );

  TestValidator.equals(
    "get_weather METADATA.tool",
    api.functional.mcp.get_weather.METADATA.tool,
    "get_weather",
  );
  TestValidator.predicate(
    "get_weather METADATA.description non-empty",
    typeof api.functional.mcp.get_weather.METADATA.description === "string" &&
      api.functional.mcp.get_weather.METADATA.description.length > 0,
  );

  const tools = [
    api.functional.mcp.add.METADATA.tool,
    api.functional.mcp.subtract.METADATA.tool,
    api.functional.mcp.divide.METADATA.tool,
    api.functional.mcp.echo_client.METADATA.tool,
    api.functional.mcp.get_weather.METADATA.tool,
    api.functional.mcp.notify.METADATA.tool,
  ].sort();
  TestValidator.equals("tool names", tools, [
    "add",
    "divide",
    "echo_client",
    "get_weather",
    "notify",
    "subtract",
  ]);
};
