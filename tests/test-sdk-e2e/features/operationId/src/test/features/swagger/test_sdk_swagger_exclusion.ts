import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies Swagger exclusion decorators do not remove SDK functions.
 *
 * Locks the distinction between SDK generation and Swagger document emission.
 * `@ApiExcludeController()` and `@ApiExcludeEndpoint()` are Swagger-only
 * decorators; generated typed SDK clients must still expose callable routes.
 *
 * 1. Read the generated SDK functional namespace.
 * 2. Assert excluded and visible controllers are all present beside the feature's
 *    own routes, and that `@ignore` routes are absent.
 * 3. Keep the assertion sorted so namespace churn is explicit.
 *
 * @evidence contracts/testing.md#behavioral-verification SDK functional exports must be exactly the feature's own articles/health/operationId/performance namespaces plus internal/swagger_excluded_controller/swagger_excluded_endpoint/swagger_visible_endpoint.
 * @evidence contracts/testing.md#independent-expectations Authored @internal/@ignore and Swagger-only exclusion decorators prescribe the handwritten namespace list. This checks export presence, not successful calls.
 * @evidence contracts/testing.md#distinguishing-cases SDK-only internal route and two Swagger exclusion forms remain beside explicitly visible endpoint; ignored routes are absent.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native route visibility and compiled generated namespace exports must connect; document-only assertions cannot establish Swagger-only exclusions leave SDK exports available.
 * @evidence contracts/e2e.md#shared-execution The operationId siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export async function test_sdk_swagger_exclusion(): Promise<void> {
  TestValidator.equals("functions", Object.keys(api.functional).sort(), [
    "articles",
    "health",
    "internal",
    "operationId",
    "performance",
    "swagger_excluded_controller",
    "swagger_excluded_endpoint",
    "swagger_visible_endpoint",
  ]);
}
