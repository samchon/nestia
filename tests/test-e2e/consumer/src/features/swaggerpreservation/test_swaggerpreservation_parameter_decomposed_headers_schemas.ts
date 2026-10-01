import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 *
 * @evidence contracts/testing.md#behavioral-verification TypedHeaders and plain Headers must preserve header placement and every component-derived property schema, supplemented by explicit range/integer/UUID-array/template pins.
 * @evidence contracts/testing.md#independent-expectations Component-to-parameter consistency shares a generated source and is insufficient alone; handwritten1/100/10,integer,UUID/minItems1 pins independently follow authored header tags.
 * @evidence contracts/testing.md#distinguishing-cases Typed versus plain decorator, complete property comparisons and tag-bearing positive pins distinguish fallback loss; template requires pattern presence only.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_headers_schemas =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const expected: Record<string, OpenApi.IJsonSchema> =
      SwaggerParameterReader.parameterSchemas(document, "IDecomposeHeaders");
    for (const path of [
      "/swagger_only/parameters/decompose/typed-headers",
      "/swagger_only/parameters/decompose/nest-headers",
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
