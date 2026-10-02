import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies vanilla field-named parameters of every type the wire can carry
 * still generate.
 *
 * The SDK now holds vanilla `@Param()` and `@Query()` parameters to the rules
 * the typed decorators follow (#1648), so a path segment must be one atomic or
 * constant type and a field-named query key an atomic or an array of atomics.
 * The accepted shapes must keep generating as they did: a literal union in a
 * path, an array of atomics and an optional literal union as query keys.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the vanilla route lists each parameter with its declared schema and
 *    optionality.
 */
export const test_swagger_vanilla_field_shapes = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  TestValidator.equals(
    "vanilla route",
    SwaggerParameterReader.parameters(
      document,
      "/field/vanilla/{kind}",
      "get",
    ).map((p) =>
      SwaggerParameterReader.canonical({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: p.schema,
      }),
    ),
    [
      SwaggerParameterReader.canonical({
        name: "kind",
        in: "path",
        required: true,
        schema: { oneOf: [{ const: "x" }, { const: "y" }] },
      }),
      SwaggerParameterReader.canonical({
        name: "ids",
        in: "query",
        required: true,
        schema: { type: "array", items: { type: "string" } },
      }),
      SwaggerParameterReader.canonical({
        name: "mode",
        in: "query",
        required: false,
        schema: { oneOf: [{ const: "a" }, { const: "b" }] },
      }),
    ],
  );
};
