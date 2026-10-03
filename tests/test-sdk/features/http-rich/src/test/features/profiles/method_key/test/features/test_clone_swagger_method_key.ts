import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@typia/interface";
import fs from "fs";
import path from "path";

import api from "../../api";

/**
 * Verifies a method the SDK renames still meets its `@SwaggerCustomizer()` and
 * passes its own name to the `operationId` generator.
 *
 * The accessor analysis renames a reserved word such as `delete` to `_delete`,
 * and the Swagger generator looked the customizer up, and named the method to
 * `operationId`, by that SDK name, so the customizer never ran and the
 * operation ID read `MethodKeyArticleController._delete` (#1734).
 *
 * 1. Call the SDK function, which keeps its escaped name `_delete`.
 * 2. Assert the Swagger operation carries the customizer's summary.
 * 3. Assert its operation ID names the method `delete`.
 *
 * @evidence contracts/testing.md#behavioral-verification The original actual escaped _delete SDK call must return a, while fresh Swagger retains the customized summary and the authored controller method delete in its operationId.
 * @evidence contracts/testing.md#independent-expectations The controller returns its authored id, its customizer writes the literal customized summary, and the original class/function callback identifies the real delete method rather than its escaped SDK accessor.
 * @evidence contracts/testing.md#distinguishing-cases The reserved method's _delete SDK accessor contrasts with its unescaped delete metadata; both summary presence and exact operationId reject lookup by the escaped name.
 * @evidence contracts/testing.md#execution-ownership The matching authored file/export is discovered in the shared compiled consumer after public generation; its SDK call reaches the shared actual listener and it reads the fresh profile document.
 * @evidence contracts/e2e.md#necessary-boundary Native method metadata, installed Swagger customizer lookup and operationId callback, escaped SDK generation and actual transport must agree on the same authored method. Direct composer units cannot prove that metadata and generated accessor connection.
 * @evidence contracts/e2e.md#shared-execution This distinct callback/no-security generation graph shares installation, default producer, one consumer compilation and listener with all existing profiles; it adds no compiler or host lifetime.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private controller and route identities isolate the stateless string response; its document is freshly generated below the owned profile root. The runner releases its generation graph and actual listener in finally.
 * @evidence contracts/e2e.md#preserved-coverage The original controller body, customizer, complete SDK/summary/operationId assertions and all imports remain apart from private identities and artifact paths. The original wrapper owns no additional behavior checks.
 */
export const test_clone_swagger_method_key = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "sdk",
    await api.functional.http_rich.options.method_key.articles._delete(
      connection,
      "a",
    ),
    "a",
  );
  const document: OpenApi.IDocument = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "../../../../../../../profiles/method_key/swagger.json",
      ),
      "utf8",
    ),
  );
  const operation =
    document.paths?.["/http_rich/options/method_key/articles/{id}"]?.delete;
  TestValidator.equals("summary", operation?.summary, "customized");
  TestValidator.equals(
    "operationId",
    operation?.operationId,
    "MethodKeyArticleController.delete",
  );
};
