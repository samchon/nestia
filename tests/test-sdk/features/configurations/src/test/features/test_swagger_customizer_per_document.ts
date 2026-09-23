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
 */
export const test_swagger_customizer_per_document = async (): Promise<void> => {
  const description = async (file: string): Promise<string> => {
    const document: OpenApi.IDocument = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../${file}`, "utf8"),
    );
    return (document.components.schemas!["IPerformance"] as OpenApi.IJsonSchema)
      .description!;
  };
  const common: string = await description("common.swagger.json");
  const application: string = await description("application.swagger.json");
  TestValidator.equals("edits", common.split("Customized.").length - 1, 1);
  TestValidator.equals("documents", application, common);
};
