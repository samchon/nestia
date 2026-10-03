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
 * 2. Assert each carries the customizer's edit to `IConfigurationsPerformance`
 *    exactly once, and that both descriptions are the same.
 *
 * @evidence contracts/testing.md#behavioral-verification Both actual documents contain exactly one non-idempotent customization and equal schema descriptions; shared baked-schema mutation would stack the literal edit in the later document.
 * @evidence contracts/testing.md#independent-expectations The authored callback appends the literal Customized. once. One occurrence and equal descriptions follow from independent per-document composition, not from a generated snapshot.
 * @evidence contracts/testing.md#distinguishing-cases The same performance metadata appears in the second and third configurations after an unrelated first configuration. Repeated composition detects retained mutation; SDK direct composition-isolation units also cover caller edits and other mutable metadata.
 * @evidence contracts/testing.md#execution-ownership The configurations integration entry discovers this matching export after the actual array configuration produces its documents. Source DTO identity is unique in the combined program; the existing literal edit count and equality assertions remain unchanged.
 * @evidence contracts/e2e.md#necessary-boundary Actual array-config CLI loading and composed native controller metadata connect the same route to two documents, detecting configuration/metadata assembly faults beyond direct Swagger unit operations.
 * @evidence contracts/e2e.md#shared-execution The owning batch prepares the program and CLI generation once for its existing configuration array; this case only reads the two resulting documents and starts no additional compiler, host or process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Both documents intentionally share source metadata and differ in configuration/application graph. The owner regenerates output before discovery; the test mutates neither document and cannot reset away accumulated edits.
 * @evidence contracts/e2e.md#preserved-coverage The original common/application document reads, one literal edit count and whole-description equality remain in this export. Only private source/schema identity changes to distinguish it from other controllers in the combined program.
 */
export const test_swagger_customizer_per_document = async (): Promise<void> => {
  const description = async (file: string): Promise<string> => {
    const document: OpenApi.IDocument = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../${file}`, "utf8"),
    );
    return (
      document.components.schemas![
        "IConfigurationsPerformance"
      ] as OpenApi.IJsonSchema
    ).description!;
  };
  const common: string = await description("common.swagger.json");
  const application: string = await description("application.swagger.json");
  TestValidator.equals("edits", common.split("Customized.").length - 1, 1);
  TestValidator.equals("documents", application, common);
};
