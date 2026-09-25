import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@typia/interface";
import fs from "fs";
import path from "path";

import api from "../../../api";

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
