import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification NaN/Infinity/negative/short vendor values remain literal null while finite remains two; every decomposed parameter retains its component schema and order.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases NaN/Infinity/negative/short vendor values remain literal null while finite remains two; every decomposed parameter retains its component schema and order.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage NaN/Infinity/negative/short vendor values remain literal null while finite remains two; every decomposed parameter retains its component schema and order. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_non_finite_extensions =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
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
      RichSwaggerParameterReader.parameterSchemas(
        document,
        "INonFiniteExtensions",
      );
    const parameters = RichSwaggerParameterReader.parameters(
      document,
      "/http_rich/swagger_parameters/extension/non-finite",
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
        RichSwaggerParameterReader.canonical(p.schema),
        RichSwaggerParameterReader.canonical(expected[p.name!]),
      );
  };
