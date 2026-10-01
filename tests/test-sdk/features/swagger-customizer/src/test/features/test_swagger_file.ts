import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { OpenApi } from "typia";

/**
 * Verifies swagger file.
 *
 * @evidence contracts/testing.md#behavioral-verification The customizer must produce version3.2.11, exact custom description and get /custom/{id}/normal selector.
 * @evidence contracts/testing.md#independent-expectations Authored customizer values prescribe all three selected expectations independently of generated document output.
 * @evidence contracts/testing.md#distinguishing-cases Document-level version and operation description/selector edits distinguish whole-document and route customization; unrelated operation fields remain unconstrained.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_file export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_file selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_swagger_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: OpenApi.IDocument = JSON.parse(content);
  const route: OpenApi.IOperation =
    swagger.paths!["/custom/{key}/{value}/customize"]!.get!;

  TestValidator.equals("swagger.openapi", swagger.openapi, "3.2.11");
  TestValidator.equals(
    "route.description",
    route.description,
    "This is a custom description",
  );
  TestValidator.equals(`route["x-selector"]`, (route as any)["x-selector"], {
    method: "get",
    path: "/custom/{id}/normal",
  });
};
