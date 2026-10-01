import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { OpenApi } from "typia";

/**
 * Verifies a `SwaggerCustomizer` edits only the document being composed when
 * one `nestia` process composes several documents from the same routes.
 *
 * An array configuration composes each document in the same process, from the
 * same controller metadata. The composed documents used to hold the baked
 * schemas by reference (#1654), so a customizer's edit to one document was
 * already present when the next composition began, and a non-idempotent
 * customizer stacked its edit once per document. The third configuration
 * composes the routes of the second one again to expose that.
 *
 * 1. Read the Swagger documents of the second and third configurations, which both
 *    hold `PerformanceController`.
 * 2. Assert each carries the customizer's edit to `IPerformance` exactly once, and
 *    that both descriptions are the same.
 *
 * @evidence contracts/testing.md#behavioral-verification Both generated documents must resolve the performance response schema and carry exactly one Customized. edit with identical descriptions; shared mutable schemas would accumulate a second edit or differ across documents.
 * @evidence contracts/testing.md#independent-expectations The handwritten customizer appends one literal edit per document composition; separate documents must begin from the same unmodified schema. Each operation's public OpenAPI reference identifies its response schema even when a combined project qualifies duplicate type names.
 * @evidence contracts/testing.md#distinguishing-cases The second and third configurations reuse the same performance routes in one generator process, contrasting isolated document composition with retained metadata. Exact edit count and cross-document equality distinguish missing customization, repeated edits and leakage.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this exported E2E function after the configurations feature has generated every document through the actual CLI; it reads those generated artifacts by its own directory.
 * @evidence contracts/e2e.md#necessary-boundary This connects configuration-array loading, native route metadata, Swagger composition and the registered customizer in one real CLI lifetime; direct independent composer calls cannot establish this complete retained-metadata connection.
 * @evidence contracts/e2e.md#shared-execution The three documents reuse the feature's generator process, controller reflection and runtime cohort; this function adds no installation, compilation or host. File-input configurations still incur separate reflection compilation in the current CLI.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Generated files belong to this feature's copied output directory and are read without mutation. The feature entry finally closes its backend after normal reports or discovery/startup failures, and the SDK batch removes its own temporary directory.
 * @evidence contracts/e2e.md#preserved-coverage Both literal edit-count and document-equality assertions remain; following the operation reference preserves the oracle under schema qualification rather than depending on a coincidental component key.
 */
export const test_swagger_customizer_per_document = async (): Promise<void> => {
  const description = async (file: string): Promise<string> => {
    const document: OpenApi.IDocument = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../${file}`, "utf8"),
    );
    const response =
      document.paths?.["/performance"]?.get?.responses?.["200"]?.content?.[
        "application/json"
      ]?.schema;
    if (!response || !("$ref" in response))
      throw new Error("Performance response must reference its object schema");
    const name = response.$ref
      .substring("#/components/schemas/".length)
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    const schema = document.components.schemas![name] as OpenApi.IJsonSchema;
    if (!schema || typeof schema.description !== "string")
      throw new Error(
        `Customized performance response schema is missing: ${name}`,
      );
    return schema.description;
  };
  const common: string = await description("common.swagger.json");
  const application: string = await description("application.swagger.json");
  TestValidator.equals("edits", common.split("Customized.").length - 1, 1);
  TestValidator.equals("documents", application, common);
};
