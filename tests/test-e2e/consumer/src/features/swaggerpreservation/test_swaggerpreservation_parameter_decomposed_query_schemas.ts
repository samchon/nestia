import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#behavioral-verification TypedQuery/plain Query parameters must match component schemas and query placement, with independent date/range/integer/array/enum/nullable/comment/plugin/template selected pins.
 * @evidence contracts/testing.md#independent-expectations The generated component comparison tests consistency, while handwritten schema cells follow authored DTO/tag semantics and establish independent expected values. Template is only pattern-presence checked.
 * @evidence contracts/testing.md#distinguishing-cases Both decorator kinds, optional integer page, UUID-array limits/uniqueness, documented enum branches and nullable email preserve distinct rich schema cases.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_query_schemas =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const expected: Record<string, OpenApi.IJsonSchema> =
      SwaggerParameterReader.parameterSchemas(document, "IDecomposeQuery");
    for (const path of [
      "/swagger_only/parameters/decompose/typed-query",
      "/swagger_only/parameters/decompose/nest-query",
    ]) {
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
