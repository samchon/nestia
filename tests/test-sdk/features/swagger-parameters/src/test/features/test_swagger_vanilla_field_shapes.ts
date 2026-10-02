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
 *
 * @evidence contracts/testing.md#behavioral-verification Checks exact vanilla path literal-union and query atomic-array/optional-union parameter summaries.
 * @evidence contracts/testing.md#independent-expectations The authored vanilla decorator types define literal union members, required path/array fields and optional mode.
 * @evidence contracts/testing.md#distinguishing-cases Path unions, query arrays and optional unions cover accepted shape distinctions; invalid vanilla shapes are owned by diagnostic fixtures.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_vanilla_field_shapes retain path unions, query arrays and optional unions cover accepted shape distinctions; invalid vanilla shapes are owned by diagnostic fixtures.
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
