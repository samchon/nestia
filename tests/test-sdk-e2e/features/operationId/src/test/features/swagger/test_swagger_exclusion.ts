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
 * 3. Assert only the visible endpoint remains beside the feature's own routes.
 *
 * @evidence contracts/testing.md#behavioral-verification The final Swagger paths must be exactly the feature's own authored paths plus /swagger-visible-endpoint; no excluded, internal or ignored path may appear.
 * @evidence contracts/testing.md#independent-expectations Authored exclusion/ignore/internal declarations establish the one handwritten visible path independently of generator output.
 * @evidence contracts/testing.md#distinguishing-cases ApiExcludeController, ApiExcludeEndpoint, false endpoint exclusion, internal and ignore contrast visibility sources; a positive visible path prevents empty-document success.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The operationId siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export async function test_swagger_exclusion(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../../swagger.json", "utf8"),
  );
  TestValidator.equals("paths", Object.keys(swagger.paths ?? {}).sort(), [
    "/articles/{id}",
    "/health",
    "/operationId/custom",
    "/performance",
    "/swagger-visible-endpoint",
  ]);
}
