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
 * @evidence contracts/testing.md#behavioral-verification Reads two documents from one configuration array, requires one Customized. suffix and matching descriptions.
 * @evidence contracts/testing.md#independent-expectations The authored customizer adds exactly one suffix per independent document; controller reuse must not accumulate edits.
 * @evidence contracts/testing.md#distinguishing-cases Repeated composition of the same route metadata distinguishes one document edit from leaked shared schema mutation.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Reads two documents from one configuration array, requires one Customized. suffix and matching descriptions. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Repeated composition of the same route metadata distinguishes one document edit from leaked shared schema mutation. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
