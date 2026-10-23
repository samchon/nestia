import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

/**
 * Verifies nonfinite numeric text in JSDoc vendor extensions stays text.
 *
 * Typia 15.2 accepts only finite JavaScript numbers in these extensions. `NaN`,
 * `Infinity`, `-Infinity`, and `inf` remain strings in both component and
 * decomposed parameter schemas; the finite twin remains a number.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the component preserves each nonfinite spelling and parses 2.
 * 3. Assert every decomposed query parameter carries the component's schema of its
 *    property, extension included.
 *
 * @evidence contracts/testing.md#behavioral-verification NaN/Infinity/negative/short vendor values preserve their authored strings while finite remains two; every decomposed parameter retains its component schema and order.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases NaN/Infinity/negative/short vendor strings contrast with finite two, catching null substitution and indiscriminate stringification; every decomposed parameter retains its component schema and order.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage All four nonfinite spellings and the finite twin retain literal assertions under typia 15.2's finite-number grammar; every decomposed parameter retains its component schema and order. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases have direct unit owners.
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
        nan: "NaN",
        infinity: "Infinity",
        negative: "-Infinity",
        short: "inf",
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
