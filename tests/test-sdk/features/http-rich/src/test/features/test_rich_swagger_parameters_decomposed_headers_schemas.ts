import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification Both typed and Nest headers retain every independently produced component property schema plus literal range/integer/UUID-array controls and a template pattern.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases Both typed and Nest headers retain every independently produced component property schema plus literal range/integer/UUID-array controls and a template pattern.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage Both typed and Nest headers retain every independently produced component property schema plus literal range/integer/UUID-array controls and a template pattern. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_decomposed_headers_schemas =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    const expected: Record<string, OpenApi.IJsonSchema> =
      RichSwaggerParameterReader.parameterSchemas(
        document,
        "IDecomposeHeaders",
      );
    for (const path of [
      "/http_rich/swagger_parameters/decompose/typed-headers",
      "/http_rich/swagger_parameters/decompose/nest-headers",
    ]) {
      const parameters: RichSwaggerParameterReader.IParameter[] =
        RichSwaggerParameterReader.parameters(document, path, "get");
      for (const p of parameters) {
        TestValidator.equals(`${path} ${p.name} in`, p.in, "header");
        TestValidator.equals(
          `${path} ${p.name} schema`,
          RichSwaggerParameterReader.canonical(p.schema),
          RichSwaggerParameterReader.canonical(expected[p.name!]),
        );
      }

      const schema = (name: string): string =>
        RichSwaggerParameterReader.canonical(
          parameters.find((p) => p.name === name)?.schema,
        );
      const pin = (name: string, value: object): void =>
        TestValidator.equals(
          `${path} ${name}`,
          schema(name),
          RichSwaggerParameterReader.canonical(value),
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
