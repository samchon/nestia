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
 *
 * @evidence contracts/testing.md#behavioral-verification Checks query and header required flags for optional and required neighbors.
 * @evidence contracts/testing.md#independent-expectations Authored optional markers determine OpenAPI required=false independently of undefined unions.
 * @evidence contracts/testing.md#distinguishing-cases Optional and required query and header entries are paired controls.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks query and header required flags for optional and required neighbors. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Optional and required query and header entries are paired controls. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
