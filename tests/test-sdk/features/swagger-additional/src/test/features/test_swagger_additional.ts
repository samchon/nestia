import { TestValidator } from "@nestia/e2e";
import { OpenApiConverter } from "@typia/utils";
import fs from "fs";
import path from "path";
import { OpenApi } from "typia";

/**
 * Verifies `swagger.additional` adds the documented extensions to every
 * operation, in the generated document and in each older OpenAPI version.
 *
 * The option was type-checked and documented, but the Swagger generator rewrite
 * of 2024 dropped the code emitting `x-nestia-method`, `x-nestia-namespace`,
 * and `x-nestia-jsDocTags`, so it did nothing (#1674). The CLI and
 * `NestiaSwaggerComposer` compose each operation through the same
 * `SwaggerOperationComposer`.
 *
 * 1. Read the operation from the generated document and assert each extension.
 * 2. Downgrade to 3.1, 3.0, and 2.0 and assert the extensions survive.
 *
 * @evidence contracts/testing.md#behavioral-verification additional:true must emit GET, bbs.articles.at and exact deprecated/tag names in the native document and3.1/3.0/2.0 downgrades.
 * @evidence contracts/testing.md#independent-expectations Authored route method/accessor/JSDoc tags establish handwritten expectations. The installed downgrader is an actual compatibility boundary, not the source of these expected values.
 * @evidence contracts/testing.md#distinguishing-cases Four versions retain identical selected vendor extensions; the2.0 input removes only the unsupported placeholder server description.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_additional export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-additional siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each downgrade starts from a fresh JSON copy of this feature’s document, so2.0 server normalization cannot affect other versions or siblings. Local validation retains no state; the harness owns copied outputs.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_additional selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_swagger_additional = async (): Promise<void> => {
  const validate = (title: string, document: any): void => {
    const operation = document.paths["/bbs/articles/{id}"].get;
    TestValidator.equals(
      `${title} method`,
      operation["x-nestia-method"],
      "GET",
    );
    TestValidator.equals(
      `${title} namespace`,
      operation["x-nestia-namespace"],
      "bbs.articles.at",
    );
    TestValidator.equals(
      `${title} jsDocTags`,
      (operation["x-nestia-jsDocTags"] as { name: string }[])
        .map((tag) => tag.name)
        .sort(),
      ["deprecated", "tag"],
    );
  };
  const generated: OpenApi.IDocument = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  validate("cli", generated);
  for (const version of ["3.1", "3.0", "2.0"] as const) {
    const source: OpenApi.IDocument = JSON.parse(JSON.stringify(generated));
    // Swagger 2.0 has no server description, so the generator leaves its
    // placeholder server undescribed when `swagger.openapi` is "2.0".
    if (version === "2.0")
      source.servers = source.servers?.map((server) => ({ url: server.url }));
    validate(
      version,
      OpenApiConverter.downgradeDocument(source, version as "3.0"),
    );
  }
};
