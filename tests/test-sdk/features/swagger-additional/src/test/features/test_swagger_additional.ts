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
