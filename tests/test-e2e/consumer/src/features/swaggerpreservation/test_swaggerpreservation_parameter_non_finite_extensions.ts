import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

/**
 * Verifies a JSDoc `@x-` extension whose text reads as a non-finite number is
 * documented as null instead of aborting generation.
 *
 * Typia reads `NaN`, `Infinity`, `-Infinity`, and `inf` as floats, and the SDK
 * serialized its metadata with a JSON encoder that refuses them, so one such
 * tag failed `nestia sdk` and `nestia swagger` for the whole project (#1655).
 * The value is written as `JSON.stringify` writes it, null, both in the
 * component and in the decomposed parameters; a finite extension stays a
 * number.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the component writes each non-finite `x-level` as null and the finite
 *    one as 2.
 * 3. Assert every decomposed query parameter carries the component's schema of its
 *    property, extension included.
 *
 * @evidence contracts/testing.md#behavioral-verification Exactly five extension properties must retain NaN/Infinity/-Infinity/inf as null and finite as2; decomposed names/schemas match each property.
 * @evidence contracts/testing.md#independent-expectations Handwritten five key names and null/null/null/null/2 follow authored JSDoc values and JSON serialization semantics. The component/parameter consistency comparison is supplemented by these literal pins.
 * @evidence contracts/testing.md#distinguishing-cases Four nonfinite spellings contrast finite numeric2; component versus decomposed placement and positive key set prevent empty-schema success.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_non_finite_extensions =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const component = document.components.schemas![
      "INonFiniteExtensions"
    ] as OpenApi.IJsonSchema.IObject;
    TestValidator.equals(
      "declared extension properties",
      Object.keys(component.properties ?? {}).sort(),
      ["finite", "infinity", "nan", "negative", "short"],
    );
    TestValidator.equals(
      "component extensions",
      Object.fromEntries(
        Object.entries(component.properties ?? {}).map(([key, value]) => [
          key,
          (value as Record<string, unknown>)["x-level"],
        ]),
      ),
      {
        nan: null,
        infinity: null,
        negative: null,
        short: null,
        finite: 2,
      },
    );

    const expected: Record<string, OpenApi.IJsonSchema> =
      SwaggerParameterReader.parameterSchemas(document, "INonFiniteExtensions");
    const parameters = SwaggerParameterReader.parameters(
      document,
      "/swagger_only/parameters/extension/non-finite",
      "get",
    );
    TestValidator.equals(
      "parameter names",
      parameters.map((p) => p.name),
      Object.keys(expected),
    );
    for (const p of parameters)
      TestValidator.equals(
        `${p.name} schema`,
        SwaggerParameterReader.canonical(p.schema),
        SwaggerParameterReader.canonical(expected[p.name!]),
      );
  };
