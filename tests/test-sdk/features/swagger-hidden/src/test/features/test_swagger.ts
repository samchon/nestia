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
 */
export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals("paths", Object.keys(swagger.paths ?? {}).sort(), [
    "/swagger-visible-endpoint",
  ]);
}
