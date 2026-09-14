import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

/**
 * Verifies decomposed query and header parameters retain optionality.
 *
 * Swagger required flags must describe the same omission accepted by the
 * controller, even when exact optional types contain no undefined union.
 *
 * 1. Generate Swagger for a query and headers with optional and required keys.
 * 2. Assert both optional flags are false and both required controls are true.
 */
export const test_swagger_optional_parameters = async (): Promise<void> => {
  const document = JSON.parse(
    await fs.promises.readFile(
      path.resolve(__dirname, "../../../swagger.json"),
      "utf8",
    ),
  );
  const parameters = document.paths["/optional/query"].get.parameters;
  for (const [name, location, required] of [
    ["optional", "query", false],
    ["required", "query", true],
    ["x-optional", "header", false],
    ["x-required", "header", true],
  ] as const) {
    const parameter = parameters.find(
      (p: { name: string; in: string }) => p.name === name && p.in === location,
    );
    TestValidator.equals(`${location} ${name}`, parameter?.required, required);
  }
};
