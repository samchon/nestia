import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies each decomposed header parameter carries typia's schema of its
 * property, for `@TypedHeaders()` and plain `@Headers()` alike.
 *
 * Header objects decompose through the same code path as query objects and lost
 * the same information (#1639). The oracle is typia's own schema of the
 * `IDecomposeHeaders` component minus the property-level fields a parameter
 * carries itself.
 *
 * 1. Read the generated Swagger document.
 * 2. For both header routes, compare every decomposed parameter's schema with the
 *    component's schema of that property, minus the fields a parameter carries
 *    itself.
 * 3. Pin the range, integer, array, and template cells.
 */
export const test_swagger_decomposed_headers_schemas =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const expected: Record<string, OpenApi.IJsonSchema> =
      SwaggerParameterReader.parameterSchemas(document, "IDecomposeHeaders");
    for (const path of [
      "/decompose/typed-headers",
      "/decompose/nest-headers",
    ]) {
      const parameters: SwaggerParameterReader.IParameter[] =
        SwaggerParameterReader.parameters(document, path, "get");
      for (const p of parameters) {
        TestValidator.equals(`${path} ${p.name} in`, p.in, "header");
        TestValidator.equals(
          `${path} ${p.name} schema`,
          SwaggerParameterReader.canonical(p.schema),
          SwaggerParameterReader.canonical(expected[p.name!]),
        );
      }

      const schema = (name: string): string =>
        SwaggerParameterReader.canonical(
          parameters.find((p) => p.name === name)?.schema,
        );
      const pin = (name: string, value: object): void =>
        TestValidator.equals(
          `${path} ${name}`,
          schema(name),
          SwaggerParameterReader.canonical(value),
        );
      pin("x-limit", { type: "number", minimum: 1, maximum: 100, default: 10 });
      pin("x-int32", { type: "integer" });
      pin("x-ids", {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
      });
      TestValidator.predicate(`${path} x-tpl pattern`, () =>
        schema("x-tpl").includes(`"pattern":`),
      );
    }
  };
