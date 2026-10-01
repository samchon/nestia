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
 * @evidence contracts/testing.md#behavioral-verification Generated3.x must expose one form/exploded query object and two separate headers;2.0 must expose exact scalar query/header names with legal types/no object refs, and upgrade must preserve all non-body parameter identities.
 * @evidence contracts/testing.md#independent-expectations Authored query/header DTOs establish the exact handwritten names. OpenAPI representations distinguish exploded query objects from individually encoded headers and2.0 scalar/array parameter fields; installed upgrade supplies a compatibility roundtrip, not the only oracle.
 * @evidence contracts/testing.md#distinguishing-cases 3.x versus2.0 object representation, query versus header placement and all operation upgrade loops retain accepted/forbidden fields. The upgrade comparison shares its input document but exact names/type/no-ref assertions are independent controls.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native query/header metadata, downgrade and installed upgrader must connect through serialized documents. A3.x parameter composer unit alone cannot prove2.0 consumers keep the same keys.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
