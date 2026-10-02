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
 * @evidence contracts/testing.md#behavioral-verification Checks non-finite vendor extensions become null while finite 2 remains numeric, then checks decomposed parameter schemas retain the component values.
 * @evidence contracts/testing.md#independent-expectations JSON serialization represents non-finite numbers as null; the authored finite and non-finite tag literals establish independent expected values.
 * @evidence contracts/testing.md#distinguishing-cases NaN, Infinity, negative infinity and inf positives are paired with finite=2, detecting both encoder rejection and over-nulling.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_non_finite_extensions retain naN, Infinity, negative infinity and inf positives are paired with finite=2, detecting both encoder rejection and over-nulling.
 */
export const test_swagger_non_finite_extensions = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const component = document.components.schemas![
    "INonFiniteExtensions"
  ] as OpenApi.IJsonSchema.IObject;
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
