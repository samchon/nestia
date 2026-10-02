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
 * @evidence contracts/testing.md#behavioral-verification Checks method, namespace and JSDoc extension values on the generated operation, then repeats after three version downgrades.
 * @evidence contracts/testing.md#independent-expectations The authored GET controller accessor and its deprecated/tag annotations establish literal extension values.
 * @evidence contracts/testing.md#distinguishing-cases Native output and OpenAPI 3.1, 3.0 and Swagger 2.0 conversions must retain the same vendor fields.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-additional/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-additional controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-additional feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-additional test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_additional retain native output and OpenAPI 3.1, 3.0 and Swagger 2.0 conversions must retain the same vendor fields.
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
