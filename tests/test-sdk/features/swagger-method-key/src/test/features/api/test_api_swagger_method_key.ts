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
 * @evidence contracts/testing.md#behavioral-verification Calls the generated escaped _delete SDK method and checks the Swagger customizer summary and original delete method operation ID.
 * @evidence contracts/testing.md#independent-expectations The authored controller echoes its id and customizer supplies customized; the operation ID callback uses the controller method name rather than escaped SDK spelling.
 * @evidence contracts/testing.md#distinguishing-cases Runtime escaped accessor success is checked alongside original-name metadata, detecting a rename that breaks customizer lookup.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-method-key/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-method-key controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-method-key feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-method-key test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_api_swagger_method_key retain runtime escaped accessor success is checked alongside original-name metadata, detecting a rename that breaks customizer lookup.
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
