import { TestValidator } from "@nestia/e2e";
import { OpenApiConverter } from "@typia/utils";
import fs from "fs";

/**
 * Verifies `decompose: false` documents only parameters a request can carry.
 *
 * With decomposition off, a query or headers object became one parameter named
 * after the handler's parameter (#1653). OpenAPI 3.x can spread a query object
 * into its keys only when the parameter says `style: form` and `explode: true`,
 * and nothing spreads an object into headers, so the 3.x document listed a
 * header named `headers`. Swagger 2.0 has no object parameter at all, and the
 * downgrade left the object's `$ref` on the parameter, which 2.0 reads as a
 * reference to a parameter definition; typia's upgrader then dropped it.
 *
 * 1. Read the 3.2 document and assert the route with both objects keeps the query
 *    object as one `style: form`, `explode: true` parameter and lists each
 *    header on its own.
 * 2. Read the Swagger 2.0 document and assert no query or header parameter holds a
 *    `$ref` or an object type, every one has a type 2.0 defines, and the route
 *    lists every query key and header.
 * 3. Upgrade the 2.0 document and assert every operation keeps every parameter.
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
export const test_clone_query_false_swagger_undecomposed_parameters =
  async (): Promise<void> => {
    const read = async (file: string): Promise<any> =>
      JSON.parse(
        await fs.promises.readFile(
          `${__dirname}/../../../../../../../profiles/${file === "v2.swagger.json" ? "query_false_v2" : "query_false"}/swagger.json`,
          "utf8",
        ),
      );
    const names = (parameters: any[]): string[] =>
      parameters.map((p) => `${p.in}:${p.name}`).sort();

    const v3: any = await read("swagger.json");
    const route: any[] =
      v3.paths["/http_rich/options/query_false/query/headers"].get.parameters;
    TestValidator.equals("3.x parameters", names(route), [
      "header:x-page",
      "header:x-tenant",
      "query:query",
    ]);
    const query: any = route.find((p) => p.in === "query");
    TestValidator.equals(
      "3.x query style",
      [query.style, query.explode],
      ["form", true],
    );

    const v2: any = await read("v2.swagger.json");
    for (const [path, item] of Object.entries<any>(v2.paths))
      for (const [method, operation] of Object.entries<any>(item))
        for (const p of operation.parameters ?? []) {
          if (p.in !== "query" && p.in !== "header") continue;
          const label: string = `2.0 ${method} ${path} ${p.name}`;
          TestValidator.equals(`${label} $ref`, p.$ref, undefined);
          TestValidator.equals(
            `${label} type`,
            ["string", "number", "integer", "boolean", "array"].includes(
              p.type,
            ),
            true,
          );
        }
    TestValidator.equals(
      "2.0 parameters",
      names(
        v2.paths["/http_rich/options/query_false/query/headers"].get.parameters,
      ),
      [
        "header:x-page",
        "header:x-tenant",
        "query:atomic",
        "query:enforce",
        "query:limit",
        "query:values",
      ],
    );

    const upgraded: any = OpenApiConverter.upgradeDocument(v2);
    for (const [path, item] of Object.entries<any>(v2.paths))
      for (const [method, operation] of Object.entries<any>(item))
        TestValidator.equals(
          `upgraded ${method} ${path}`,
          names(upgraded.paths[path][method].parameters ?? []),
          names(
            (operation.parameters ?? []).filter((p: any) => p.in !== "body"),
          ),
        );
  };
