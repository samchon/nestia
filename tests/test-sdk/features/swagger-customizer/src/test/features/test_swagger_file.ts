import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { OpenApi } from "typia";

/**
 * Reads generated Swagger and checks the customizer description, selected
 * original route and emitted OpenAPI version.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads generated Swagger and checks the customizer description, selected original route and emitted OpenAPI version.
 * @evidence contracts/testing.md#independent-expectations The authored customizer provides the literal description and selector; the authored document customizer assigns the literal OpenAPI version 3.2.11.
 * @evidence contracts/testing.md#distinguishing-cases Customized operation identity and selector metadata are asserted together; move and inheritance boundaries have companion tests.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-customizer/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-customizer controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-customizer test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_file retain customized operation identity and selector metadata are asserted together; move and inheritance boundaries have companion tests.
 */
export const test_swagger_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: OpenApi.IDocument = JSON.parse(content);
  const route: OpenApi.IOperation =
    swagger.paths!["/custom/{key}/{value}/customize"]!.get!;

  TestValidator.equals("swagger.openapi", swagger.openapi, "3.2.11");
  TestValidator.equals(
    "route.description",
    route.description,
    "This is a custom description",
  );
  TestValidator.equals(`route["x-selector"]`, (route as any)["x-selector"], {
    method: "get",
    path: "/custom/{id}/normal",
  });
};
