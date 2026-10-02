import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies Swagger exclusion decorators remove only hidden Swagger paths.
 *
 * Locks `SwaggerGenerator`'s handling of `@ApiExcludeController()` and
 * `@ApiExcludeEndpoint()`. The fixture intentionally leaves one visible route
 * beside excluded routes so the test fails if the generator either ignores
 * exclusions or drops the whole controller namespace.
 *
 * 1. Read the generated Swagger document.
 * 2. List all emitted paths.
 * 3. Assert only the visible endpoint remains.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads generated Swagger and requires exactly the visible endpoint path.
 * @evidence contracts/testing.md#independent-expectations The authored controller and endpoint exclusion decorators define which paths may appear in documentation.
 * @evidence contracts/testing.md#distinguishing-cases A visible sibling is the negative control against dropping the entire namespace; excluded paths must not appear.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-hidden/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-hidden controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-hidden feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-hidden test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger retain a visible sibling is the negative control against dropping the entire namespace; excluded paths must not appear.
 */
export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals("paths", Object.keys(swagger.paths ?? {}).sort(), [
    "/swagger-visible-endpoint",
  ]);
}
