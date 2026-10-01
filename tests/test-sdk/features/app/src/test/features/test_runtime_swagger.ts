import { TestValidator } from "@nestia/e2e";
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
 * @evidence contracts/testing.md#behavioral-verification The running feature /api-json response must have HTTP200, satisfy the installed OpenAPI document validator and contain an actual GET /health operation.
 * @evidence contracts/testing.md#independent-expectations The authored HealthController supplies GET /health and the public OpenAPI document type supplies the shape oracle. Type validation alone cannot certify every operation semantic; the literal health path strengthens it.
 * @evidence contracts/testing.md#distinguishing-cases This owns a nonempty runtime document versus the empty-module bootstrap and invalid metadata rejection siblings. It does not repeat every generated Swagger field assertion.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects running feature backend composition, Nest Swagger endpoint registration, HTTP serialization and installed OpenAPI validation; a direct composer call cannot prove publication.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; native dispatch and Node processes are shared while each member keeps its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This uses the existing feature backend and runtime without another build/server; the feature entry finally closes that backend after discovery or assertion failure.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
 */
export const test_runtime_swagger = async (): Promise<void> => {
  const response: Response = await fetch(
    `http://127.0.0.1:${process.env.TEST_SDK_PORT ?? 37_000}/api-json`,
  );
  TestValidator.equals("swagger status", response.status, 200);
  const document: OpenApi.IDocument = await response.json();
  typia.assert(document);
  TestValidator.equals(
    "health operation",
    document.paths?.["/health"]?.get !== undefined,
    true,
  );
};
