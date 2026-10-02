import typia, { OpenApi } from "typia";

/**
 * Verifies the running application exposes a valid OpenAPI document.
 *
 * Why: The runtime Swagger endpoint is consumed directly by clients, so its
 * emitted document must still conform to Nestia's OpenAPI contract.
 *
 * 1. Fetch the application's configured `/api-json` endpoint.
 * 2. Validate the response against the OpenAPI document type.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches /api-json and validates the produced OpenAPI document with typia.assert.
 * @evidence contracts/testing.md#independent-expectations OpenApi.IDocument defines the structural oracle independently of the composed document.
 * @evidence contracts/testing.md#distinguishing-cases The successful document shape is covered; invalid composition metadata is owned by test_runtime_swagger_errors.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Fetches /api-json and validates the produced OpenAPI document with typia.assert. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The successful document shape is covered; invalid composition metadata is owned by test_runtime_swagger_errors. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_runtime_swagger = async (): Promise<void> => {
  const response: Response = await fetch(
    `http://127.0.0.1:${process.env.TEST_SDK_PORT ?? 37_000}/api-json`,
  );
  const document: OpenApi.IDocument = await response.json();
  typia.assert(document);
};
