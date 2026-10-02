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
 */
export async function test_sdk(): Promise<void> {
  TestValidator.equals("functions", Object.keys(api.functional).sort(), [
    "internal",
    "swagger_excluded_controller",
    "swagger_excluded_endpoint",
    "swagger_visible_endpoint",
  ]);
}
