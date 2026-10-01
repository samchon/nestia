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
 * @evidence contracts/testing.md#behavioral-verification Vanilla field route must contain exact kind path x/y union, required string-array ids query and optional a/b-union mode query summaries.
 * @evidence contracts/testing.md#independent-expectations Authored vanilla Param/Query type and optional declarations establish handwritten canonical objects independently of current document output.
 * @evidence contracts/testing.md#distinguishing-cases Path literal union, query atomic array and optional literal union retain three accepted field-shape branches; error features own forbidden shapes.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_vanilla_field_shapes export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_vanilla_field_shapes documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
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
