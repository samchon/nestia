import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed typed query is one required form/explode object
 * parameter.
 *
 * Public generation from compiled controller metadata must preserve
 * object-query wire encoding in OpenAPI metadata.
 *
 * 1. Read the document generated from the shared authored controller inputs.
 * 2. Assert the authored expected query parameter is named query with the
 *    QueryFalseIQuery reference, required true, form style and explode true.
 *
 * @evidence contracts/testing.md#behavioral-verification The original generated document assertions exercise object requiredness, form/explode encoding, header decomposition or Swagger2 conversion without replacing their expected values.
 * @evidence contracts/testing.md#independent-expectations Authored DTO fields, literal wire values and OpenAPI format requirements establish the preserved expectations independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases This original case retains its complete valid, optional, nullable, malformed or version-specific inputs and assertion branches; the other eight cases retain complementary distinctions.
 * @evidence contracts/testing.md#execution-ownership The matching authored export is discovered in the shared installed consumer profile; direct unit populations remain separate.
 * @evidence contracts/e2e.md#necessary-boundary Actual native controller metadata and public generator options must reach the generated document; direct authored-metadata units do not establish this connection.
 * @evidence contracts/e2e.md#shared-execution The two necessary document versions share installation, authored producer, consumer compilation and one listener; the Swagger2 profile generates no SDK or automated tests.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate these stateless handlers. Each document version has its own output and all authored calls share only immutable artifacts.
 * @evidence contracts/e2e.md#preserved-coverage All original invocation and assertion bodies remain after reversible names, imports, route identities and document locations; no additional random generated calls are introduced.
 */
export const test_clone_query_false_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../../../../../../profiles/query_false/swagger.json`,
      "utf8",
    ),
  );
  TestValidator.equals(
    "query",
    {
      name: "query",
      in: "query",
      schema: { $ref: "#/components/schemas/QueryFalseIQuery" },
      required: true,
      style: "form",
      explode: true,
    },
    content.paths[
      "/http_rich/options/query_false/query/typed"
    ].get.parameters.find((p: any) => p.in === "query")!,
  );
};
