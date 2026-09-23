import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies header and query objects with a dynamic key are documented as far as
 * OpenAPI can describe them.
 *
 * Decomposition named each parameter after its property's literal key, and a
 * dynamic key has none, so a plain `@Headers()` or `@Query()` typed
 * `Record<string, string>` crashed Swagger generation (#1645). OpenAPI 3.x
 * describes a query object with a dynamic key as one form-style parameter that
 * explodes into arbitrary keys, so such an object stays one parameter, required
 * only when one of its named keys is. No header can describe arbitrary names,
 * so a header object contributes its known keys only.
 *
 * 1. Read the generated Swagger document, which exists only if generation did not
 *    crash.
 * 2. Assert the pure-`Record` header object yields no parameter, and the mixed one
 *    yields its known header.
 * 3. Assert each query object with a dynamic key is one parameter whose schema
 *    keeps the dynamic part as `additionalProperties`, and the mixed one keeps
 *    its known `page` property too.
 * 4. Assert only the object with a required named key is a required parameter.
 */
export const test_swagger_dynamic_key_objects = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const summary = (path: string): string[] =>
    SwaggerParameterReader.parameters(document, path, "get").map(
      (p) => `${p.in}:${p.name}`,
    );
  const resolve = (schema: OpenApi.IJsonSchema): OpenApi.IJsonSchema.IObject =>
    ("$ref" in schema
      ? document.components.schemas![
          schema.$ref.substring("#/components/schemas/".length)
        ]
      : schema) as OpenApi.IJsonSchema.IObject;

  TestValidator.equals("record headers", summary("/record/headers"), []);
  TestValidator.equals("mixed headers", summary("/record/mixed-headers"), [
    "header:x-tenant",
  ]);

  for (const path of ["/record/query", "/record/mixed", "/record/required"]) {
    TestValidator.equals(path, summary(path), ["query:query"]);
    const schema: OpenApi.IJsonSchema.IObject = resolve(
      SwaggerParameterReader.parameters(document, path, "get")[0]!.schema,
    );
    TestValidator.equals(`${path} type`, schema.type, "object");
    TestValidator.equals(
      `${path} required`,
      SwaggerParameterReader.parameters(document, path, "get")[0]!.required,
      path === "/record/required",
    );
    TestValidator.equals(
      `${path} additionalProperties`,
      SwaggerParameterReader.canonical(schema.additionalProperties),
      SwaggerParameterReader.canonical({ type: "string" }),
    );
  }
  TestValidator.equals(
    "mixed page",
    SwaggerParameterReader.canonical(
      resolve(
        SwaggerParameterReader.parameters(document, "/record/mixed", "get")[0]!
          .schema,
      ).properties?.page,
    ),
    SwaggerParameterReader.canonical({ type: "string" }),
  );
};
