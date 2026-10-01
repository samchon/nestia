import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@typia/interface";
import fs from "fs";
import path from "path";

import api from "@api";

/**
 * Verifies a method the SDK renames still meets its `@SwaggerCustomizer()` and
 * passes its own name to the `operationId` generator.
 *
 * The accessor analysis renames a reserved word such as `delete` to `_delete`,
 * and the Swagger generator looked the customizer up, and named the method to
 * `operationId`, by that SDK name, so the customizer never ran and the
 * operation ID read `ArticleController._delete` (#1734).
 *
 * 1. Call the SDK function, which keeps its escaped name `_delete`.
 * 2. Assert the Swagger operation carries the customizer's summary.
 * 3. Assert its operation ID names the method `delete`.
 *
 * @evidence contracts/testing.md#behavioral-verification Escaped SDK _delete must echo a, while Swagger customizer summary is customized and operationId is ArticleController.delete.
 * @evidence contracts/testing.md#independent-expectations The authored delete handler, customizer and operationId callback prescribe explicit a/customized/original method name.
 * @evidence contracts/testing.md#distinguishing-cases Escaped client accessor versus original runtime method key distinguishes SDK naming from decorator lookup and operationId identity.
 * @evidence contracts/testing.md#execution-ownership The matching test_api_swagger_method_key export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native accessor rewriting, actual HTTP call, decorator lookup and final Swagger operationId must connect; a name allocator unit cannot prove customizer invocation on the original method.
 * @evidence contracts/e2e.md#shared-execution The swagger-method-key siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_api_swagger_method_key selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_api_swagger_method_key = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "sdk",
    await api.functional.articles._delete(connection, "a"),
    "a",
  );
  const document: OpenApi.IDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../../swagger.json"), "utf8"),
  );
  const operation = document.paths?.["/articles/{id}"]?.delete;
  TestValidator.equals("summary", operation?.summary, "customized");
  TestValidator.equals(
    "operationId",
    operation?.operationId,
    "ArticleController.delete",
  );
};
