import { TestValidator } from "@nestia/e2e";
import fs from "fs";

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
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_multiline_tags export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-example siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_multiline_tags selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_swagger_multiline_tags = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf-8"),
  );
  const operation: any = swagger.paths["/multiline"].get;
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
