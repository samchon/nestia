import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies checks the generated 202 JSON response references IUser.
 *
 * The authored getUserProfile response is IUser at status 202; OpenAPI local
 * references use the components/schemas prefix.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks the generated 202 JSON response references IUser.
 * @evidence contracts/testing.md#independent-expectations The authored getUserProfile response is IUser at status 202; OpenAPI local references use the components/schemas prefix.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the 202 schema reference; the propagation client case owns runtime response discrimination.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks the generated 202 JSON response references IUser. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage This case owns the 202 schema reference; the propagation client case owns runtime response discrimination. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const route = content.paths["/users/{user_id}/user"].get;

  TestValidator.equals(
    "202",
    route.responses["202"].content["application/json"].schema.$ref,
    "#/components/schemas/IUser",
  );
};
