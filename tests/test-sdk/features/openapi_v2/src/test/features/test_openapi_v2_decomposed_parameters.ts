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
 * @evidence contracts/testing.md#behavioral-verification The generated /search parameters must retain keyword string/minLength 1 and page integer/minimum 0 while omitting deprecated on every parameter.
 * @evidence contracts/testing.md#independent-expectations ISearchQuery authors the constraints; Swagger 2.0 parameter fields do not include deprecated.
 * @evidence contracts/testing.md#distinguishing-cases String and numeric tagged properties, plus absence of a deprecated parameter field, distinguish decomposition constraints from invalid version-specific fields.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary Compiled typia property metadata must survive decomposition and document downgrade into the emitted Swagger parameter fields.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
