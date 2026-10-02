import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies field-named `@Headers("name")` parameters appear in the operation.
 *
 * The operation composer listed path, query, query-object, and header-object
 * parameters but never field headers (#1641), so a header the endpoint requires
 * was missing from the document. A field header must be listed with its
 * declared schema and optionality, next to a header object when the route has
 * both.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the field route lists path, query, and both field headers, with the
 *    optional header not required.
 * 3. Assert the combined route lists the field header and the decomposed header
 *    object.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks exact field path/query/header parameter summaries and the combined field-plus-object header list.
 * @evidence contracts/testing.md#independent-expectations Authored decorator names, DTO UUID tags and optionality establish literal parameter expectations.
 * @evidence contracts/testing.md#distinguishing-cases Required versus optional headers and field-only versus combined object headers distinguish omission and over-decomposition.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_field_headers retain required versus optional headers and field-only versus combined object headers distinguish omission and over-decomposition.
 */
export const test_swagger_field_headers = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const summary = (path: string) =>
    SwaggerParameterReader.parameters(document, path, "get").map((p) =>
      SwaggerParameterReader.canonical({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: p.schema,
      }),
    );

  TestValidator.equals("field route", summary("/field/{id}"), [
    SwaggerParameterReader.canonical({
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    }),
    SwaggerParameterReader.canonical({
      name: "limit",
      in: "query",
      required: true,
      schema: { type: "string" },
    }),
    SwaggerParameterReader.canonical({
      name: "x-trace",
      in: "header",
      required: true,
      schema: { type: "string", format: "uuid" },
    }),
    SwaggerParameterReader.canonical({
      name: "x-optional",
      in: "header",
      required: false,
      schema: { type: "string" },
    }),
  ]);
  TestValidator.equals(
    "combined route",
    SwaggerParameterReader.parameters(
      document,
      "/field/{id}/combined",
      "get",
    ).map((p) => `${p.in}:${p.name}`),
    ["path:id", "header:x-trace", "header:x-tenant", "header:x-locale"],
  );
};
