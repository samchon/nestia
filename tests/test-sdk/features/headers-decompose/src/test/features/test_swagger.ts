import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies checks emitted header parameter names x-category, x-memo, x-name,
 * x-values and x-flags.
 *
 * The authored decomposable header DTO names establish the expected OpenAPI
 * parameter names.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks emitted header parameter names x-category, x-memo, x-name, x-values and x-flags.
 * @evidence contracts/testing.md#independent-expectations The authored decomposable header DTO names establish the expected OpenAPI parameter names.
 * @evidence contracts/testing.md#distinguishing-cases Header-only filtering excludes path parameters; the five expected names distinguish omitted or added decomposition fields.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks emitted header parameter names x-category, x-memo, x-name, x-values and x-flags. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Header-only filtering excludes path parameters; the five expected names distinguish omitted or added decomposition fields. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const headers = content.paths["/headers/{section}"].patch.parameters.filter(
    (p: any) => p.in === "header",
  );
  TestValidator.equals(
    "headers",
    headers.map((p: any) => p.name),
    ["x-category", "x-memo", "x-name", "x-values", "x-flags"],
  );
};
