import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed query object is required only when the request must
 * send one of its keys.
 *
 * With `decompose: false` the whole DTO is one query parameter, which used to
 * take `required` from the handler parameter alone. A DTO whose properties are
 * all optional is satisfied by an empty query string, so marking it required
 * made Swagger UI and request validators demand a value the endpoint does not
 * need. The rule counts only the keys the document describes, and leaves a
 * field-named parameter, which is one query key of its own, as declared.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the all-optional DTO and a DTO whose only required property is
 *    `@ignore`d are not required.
 * 3. Assert the DTO with a required property and a field-named parameter are
 *    required.
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
export const test_clone_query_false_swagger_optional_object =
  async (): Promise<void> => {
    const content = JSON.parse(
      await fs.promises.readFile(
        `${__dirname}/../../../../../../../profiles/query_false/swagger.json`,
        "utf8",
      ),
    );
    const required = (path: string): boolean | undefined =>
      content.paths[path].get.parameters.find((p: any) => p.in === "query")
        ?.required;
    TestValidator.equals(
      "optional",
      required("/http_rich/options/query_false/query/optional"),
      false,
    );
    TestValidator.equals(
      "ignored",
      required("/http_rich/options/query_false/query/ignored"),
      false,
    );
    TestValidator.equals(
      "typed",
      required("/http_rich/options/query_false/query/typed"),
      true,
    );
    TestValidator.equals(
      "field",
      required("/http_rich/options/query_false/query/individual"),
      true,
    );
  };
