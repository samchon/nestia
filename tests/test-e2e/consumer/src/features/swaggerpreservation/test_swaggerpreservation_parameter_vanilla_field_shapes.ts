import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_vanilla_field_shapes =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    TestValidator.equals(
      "vanilla route",
      SwaggerParameterReader.parameters(
        document,
        "/swagger_only/parameters/field/vanilla/{kind}",
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
