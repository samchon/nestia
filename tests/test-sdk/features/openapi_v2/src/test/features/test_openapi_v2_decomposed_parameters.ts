import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies decomposed query parameters keep typia's constraints in a Swagger
 * 2.0 document, without a parameter `deprecated` field.
 *
 * Why: a decomposed parameter takes its schema from typia (#1639) and marks a
 * `@deprecated` property as deprecated (#1642). Swagger 2.0 inlines the schema
 * into the parameter, and it defines no `deprecated` on a parameter, which the
 * downgrader would copy through unchanged. The generator therefore leaves the
 * flag out when it targets 2.0.
 *
 * 1. Read the generated 2.0 document of a route with a decomposed query DTO that
 *    has a tagged and a deprecated property.
 * 2. Assert each parameter carries its constraints inline.
 * 3. Assert no parameter carries `deprecated`.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated /search parameters must retain query keyword/string/minLength1 and page/integer/minimum0 inline, and no parameter may contain deprecated.
 * @evidence contracts/testing.md#independent-expectations Authored tagged query properties supply the length/integer/minimum constraints; Swagger2 parameter schema placement and lack of parameter deprecated establish the expected representation independently of output.
 * @evidence contracts/testing.md#distinguishing-cases Tagged string/integer and deprecated property contrast constraint retention with unsupported-field removal. Missing keyword/page fails optional-property equality, while the check covers only these selected constraints.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native tag metadata, decomposition and actual2.0 downgrade must retain final parameter constraints; a3.x composer unit alone cannot prove inline downgraded output.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_openapi_v2_decomposed_parameters =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    const parameters: any[] = swagger.paths["/search"].get.parameters;
    const keyword: any = parameters.find((p) => p.name === "keyword");
    const page: any = parameters.find((p) => p.name === "page");
    TestValidator.equals("keyword in", keyword?.in, "query");
    TestValidator.equals("keyword type", keyword?.type, "string");
    TestValidator.equals("keyword minLength", keyword?.minLength, 1);
    TestValidator.equals("page type", page?.type, "integer");
    TestValidator.equals("page minimum", page?.minimum, 0);
    TestValidator.equals(
      "no deprecated",
      parameters.filter((p) => "deprecated" in p).map((p) => p.name),
      [],
    );
  };
