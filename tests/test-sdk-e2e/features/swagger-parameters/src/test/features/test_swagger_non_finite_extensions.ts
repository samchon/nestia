import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_non_finite_extensions export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_non_finite_extensions documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_non_finite_extensions = async (): Promise<void> => {
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
    "/extension/non-finite",
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
