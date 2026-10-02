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
 *
 * @evidence contracts/testing.md#behavioral-verification Checks typed and vanilla decomposed header schemas against their component schemas and literal range/integer/array pins.
 * @evidence contracts/testing.md#independent-expectations Independent DTO tag semantics pin minimum/maximum/default and integer/array constraints; component agreement additionally detects decomposition loss but cannot detect a shared component defect.
 * @evidence contracts/testing.md#distinguishing-cases Typed and vanilla routes exercise the same property constraints, including UUID arrays and template patterns.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_headers_schemas retain typed and vanilla routes exercise the same property constraints, including UUID arrays and template patterns.
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
