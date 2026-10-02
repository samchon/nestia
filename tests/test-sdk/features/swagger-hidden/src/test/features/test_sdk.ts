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
 * 2. Assert excluded and visible controllers are all present.
 * 3. Keep the assertion sorted so namespace churn is explicit.
 *
 * @evidence contracts/testing.md#behavioral-verification Imports the generated SDK and checks its functional namespace still contains Swagger-excluded and visible controllers.
 * @evidence contracts/testing.md#independent-expectations Swagger exclusion affects documentation only; all four authored controller accessors remain part of the typed SDK contract.
 * @evidence contracts/testing.md#distinguishing-cases Excluded controller, excluded endpoint and visible endpoint identities distinguish SDK preservation from Swagger omission.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-hidden/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-hidden controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-hidden feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-hidden test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_sdk retain excluded controller, excluded endpoint and visible endpoint identities distinguish SDK preservation from Swagger omission.
 */
export async function test_sdk(): Promise<void> {
  TestValidator.equals("functions", Object.keys(api.functional).sort(), [
    "internal",
    "swagger_excluded_controller",
    "swagger_excluded_endpoint",
    "swagger_visible_endpoint",
  ]);
}
