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
