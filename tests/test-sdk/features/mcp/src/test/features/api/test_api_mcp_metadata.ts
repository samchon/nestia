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
 * 3. Assert the six selected generated tools are represented exactly once.
 *
 * @evidence contracts/testing.md#behavioral-verification Imports freshly generated MCP wrapper namespaces and checks protocol, tool names and authored method descriptions.
 * @evidence contracts/testing.md#independent-expectations Literal expected names and descriptions come from authored McpRoute decorators and controller JSDoc, independently of generated METADATA.
 * @evidence contracts/testing.md#distinguishing-cases Checks six original generated tools and selected descriptions; live tools_list separately owns inherited tools and derived-name exclusions.
 * @evidence contracts/testing.md#execution-ownership The mcp feature harness discovers this matching test export through DynamicExecutor after producing its controller and SDK artifacts; this is an integration case, not a direct pure unit.
 * @evidence contracts/e2e.md#necessary-boundary Checks native transformation and SDK generation through imported freshly produced metadata; checking committed source text would not exercise that producer connection.
 * @evidence contracts/e2e.md#shared-execution The mcp harness shares one prepared feature program, generated SDK and backend among its discovered cases. Protocol cases open and close their own clients. Other SDK features still have separate preparation lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads generated constants without mutable host state; the harness owns generated artifacts and backend teardown.
 * @evidence contracts/e2e.md#preserved-coverage This case still imports freshly generated mcp wrapper namespaces and checks protocol, tool names and authored method descriptions. No existing assertion is removed or transferred by adding its acknowledgment.
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
