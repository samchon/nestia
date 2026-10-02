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
 * @evidence contracts/testing.md#behavioral-verification 3.x keeps a form/explode query object and individual headers; 2.0 keeps every scalar key without object references, and upgrading preserves each nonbody parameter.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: 3.x keeps a form/explode query object and individual headers; 2.0 keeps every scalar key without object references, and upgrading preserves each nonbody parameter.
 * @evidence contracts/testing.md#distinguishing-cases 3.x keeps a form/explode query object and individual headers; 2.0 keeps every scalar key without object references, and upgrading preserves each nonbody parameter.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-false installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The CLI document pipeline and its downgrade/upgrade adapters must preserve transport-visible parameters.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-false fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-false fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_swagger_undecomposed_parameters = async (): Promise<void> => {
  const read = async (file: string): Promise<any> =>
    JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../${file}`, "utf8"),
    );
  const names = (parameters: any[]): string[] =>
    parameters.map((p) => `${p.in}:${p.name}`).sort();

  const v3: any = await read("swagger.json");
  const route: any[] = v3.paths["/query/headers"].get.parameters;
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
          ["string", "number", "integer", "boolean", "array"].includes(p.type),
          true,
        );
      }
  TestValidator.equals(
    "2.0 parameters",
    names(v2.paths["/query/headers"].get.parameters),
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
        names((operation.parameters ?? []).filter((p: any) => p.in !== "body")),
      );
};
