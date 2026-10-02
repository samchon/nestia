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
