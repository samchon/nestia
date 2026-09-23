import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies a header or query object with a dynamic key stays one parameter
 * instead of being decomposed.
 *
 * Decomposition named each parameter after its property's literal key, and a
 * dynamic key has none, so a plain `@Headers()` or `@Query()` typed
 * `Record<string, string>` crashed Swagger generation (#1645). Such an object
 * cannot be split into named parameters, and splitting off its known keys would
 * drop the dynamic part, so the undecomposed parameter with typia's object
 * schema is the complete description.
 *
 * 1. Read the generated Swagger document, which exists only if generation did not
 *    crash.
 * 2. Assert each dynamic-key route has exactly one parameter, named after the
 *    handler parameter, in the right location.
 * 3. Assert its schema keeps the dynamic part as `additionalProperties`, and the
 *    mixed object keeps its known `page` property too.
 */
export const test_swagger_dynamic_key_objects = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const resolve = (schema: OpenApi.IJsonSchema): OpenApi.IJsonSchema.IObject =>
    ("$ref" in schema
      ? document.components.schemas![
          schema.$ref.substring("#/components/schemas/".length)
        ]
      : schema) as OpenApi.IJsonSchema.IObject;

  for (const [path, location, name] of [
    ["/record/headers", "header", "headers"],
    ["/record/query", "query", "query"],
    ["/record/mixed", "query", "query"],
  ] as const) {
    const parameters: SwaggerParameterReader.IParameter[] =
      SwaggerParameterReader.parameters(document, path, "get");
    TestValidator.equals(
      `${path} parameters`,
      parameters.map((p) => `${p.in}:${p.name}`),
      [`${location}:${name}`],
    );
    const schema: OpenApi.IJsonSchema.IObject = resolve(parameters[0]!.schema);
    TestValidator.equals(`${path} type`, schema.type, "object");
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
