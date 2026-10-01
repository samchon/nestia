import { TestValidator } from "@nestia/e2e";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

/**
 * Verifies route tags whose text runs over lines are read by their first word.
 *
 * The SDK's JSDoc reader ended every tag at its first line, and now keeps the
 * lines after it, as TypeScript does. The readers of `@tag`, `@throws`,
 * `@security`, and `@operationId` split the text at spaces only, so the first
 * word ran into the next line's: a tag took the next line into its name, and so
 * did a security scheme, an operation id, or a status with nothing after it on
 * its line, which then vanished.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the route's tag and its description, the 404 response and its
 *    description, the security scopes, and the operation id.
 *
 * @evidence contracts/testing.md#behavioral-verification Multiline tags must yield exact Multiline tag/description,404 multiline description, bearer read/write scopes and readMultilineTags operationId.
 * @evidence contracts/testing.md#independent-expectations Authored controller tags independently supply each handwritten word/description/status/scope/operation identifier.
 * @evidence contracts/testing.md#distinguishing-cases First word versus newline continuation is tested for four different tag readers; the404 lookup prevents silently dropping a multiline status.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered and awaited by the existing installed rich consumer after actual native SDK/Swagger generation; any assertion rejection fails its report.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The original output assertions read existing rich artifacts and reuse one installed producer, generator and consumer program without another application or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader anchors fresh artifacts to the caller-owned sandbox and does not mutate them; the shared entry owns resource cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original multiline literal text, whitespace, tag, security, description and operationId controls remain with their distinct SDK or document owner. Source-exclusion and version-configuration connections stay pending.
 */
export const test_swaggerpreservation_example_document_multiline_tags =
  async (): Promise<void> => {
    const swagger: any = await SwaggerParameterReader.document();
    const operation: any =
      swagger.paths["/swagger_only/examples/multiline"].get;
    TestValidator.equals("tags", operation.tags, ["Multiline"]);
    TestValidator.equals(
      "tag description",
      swagger.tags.find((tag: any) => tag.name === "Multiline")?.description,
      "Tags whose text runs over lines",
    );
    TestValidator.equals(
      "throws",
      operation.responses["404"]?.description,
      "When nothing is found under the key it was asked for, even\nafter the fallback was consulted",
    );
    TestValidator.equals("security", operation.security, [
      { bearer: ["read", "write"] },
    ]);
    TestValidator.equals(
      "operationId",
      operation.operationId,
      "readMultilineTags",
    );
  };
