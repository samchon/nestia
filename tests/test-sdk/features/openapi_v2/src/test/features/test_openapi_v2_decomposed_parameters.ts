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
