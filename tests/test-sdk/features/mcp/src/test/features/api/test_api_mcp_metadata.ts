import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
    api.functional.mcp.get_weather.METADATA.tool,
  ].sort();
  TestValidator.equals("tool names", tools, [
    "add",
    "divide",
    "get_weather",
    "subtract",
  ]);
};
