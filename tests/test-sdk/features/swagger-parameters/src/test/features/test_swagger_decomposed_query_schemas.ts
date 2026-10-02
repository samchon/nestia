import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

/**
 * Verifies each decomposed query parameter carries typia's schema of its
 * property, for `@TypedQuery()` and plain `@Query()` alike.
 *
 * The decomposed schemas used to come from a JS fallback that kept only the
 * atomic kind (#1639): every type tag and comment tag was dropped,
 * `Type<"int32">` became `number`, template literals lost their `pattern`, and
 * enum members lost their docs. The oracle is typia's own schema of the same
 * object, the `IDecomposeQuery` component, minus the property-level fields a
 * parameter carries itself; a few tag-bearing cells are also pinned to typia's
 * tag semantics directly.
 *
 * 1. Read the generated Swagger document.
 * 2. For both query routes, compare every decomposed parameter's schema with the
 *    component's schema of that property, minus the fields a parameter carries
 *    itself.
 * 3. Pin the format, range, integer, array, template, enum, and nullable cells.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks typed and vanilla query decomposition against component schemas and explicit format/range/array/enum/nullability/vendor literal pins.
 * @evidence contracts/testing.md#independent-expectations Authored DTO tags define the literal constraints; component agreement detects projection loss with a shared-oracle limitation for unpinned properties.
 * @evidence contracts/testing.md#distinguishing-cases Typed and vanilla routes include integer versus number, UUID arrays, templates, enum descriptions, nullable unions and custom extensions.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_query_schemas retain typed and vanilla routes include integer versus number, UUID arrays, templates, enum descriptions, nullable unions and custom extensions.
 */
export const test_swagger_decomposed_query_schemas =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const expected: Record<string, OpenApi.IJsonSchema> =
      SwaggerParameterReader.parameterSchemas(document, "IDecomposeQuery");
    for (const path of ["/decompose/typed-query", "/decompose/nest-query"]) {
      const parameters: SwaggerParameterReader.IParameter[] =
        SwaggerParameterReader.parameters(document, path, "get");
      for (const p of parameters) {
        TestValidator.equals(`${path} ${p.name} in`, p.in, "query");
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
      pin("from", { type: "string", format: "date-time" });
      pin("limit", { type: "number", minimum: 1, maximum: 100, default: 10 });
      pin("int32", { type: "integer" });
      pin("page", { type: "integer", minimum: 0, default: 1 });
      pin("ids", {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      });
      pin("commentFormat", { type: "string", format: "uuid" });
      pin("described", { type: "string", maxLength: 8 });
      pin("readonlyProp", { type: "string" });
      pin("custom", { type: "string", "x-custom": "value" });
      pin("kind", {
        oneOf: [
          { const: "a", description: "First kind." },
          { const: "b", title: "Second" },
        ],
      });
      pin("nullable", {
        oneOf: [{ type: "null" }, { type: "string", format: "email" }],
      });
      TestValidator.predicate(`${path} tpl pattern`, () =>
        schema("tpl").includes(`"pattern":`),
      );
    }
  };
