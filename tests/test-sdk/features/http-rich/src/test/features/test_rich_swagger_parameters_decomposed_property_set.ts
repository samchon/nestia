import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

/**
 * Verifies decomposition emits exactly the properties typia's object schema
 * describes.
 *
 * The decomposed parameters must be exactly the properties the object schema
 * typia writes describes: the same names, in declaration order, with matching
 * required flags. typia drops `@internal` members from the metadata itself and
 * `@hidden` and `@ignore` members from the schema, so none of them may become a
 * parameter. The formatter rewrites `@hidden` to `@ignore` in these sources, so
 * `@hidden` is pinned by the SDK's Go tests instead.
 *
 * 1. Read the generated Swagger document.
 * 2. For each decomposed route, compare parameter names and required flags with
 *    the component's properties and required list.
 * 3. Assert the `@internal` and `@ignore` members appear nowhere.
 *
 * @evidence contracts/testing.md#behavioral-verification Typed and Nest query/header parameter names and required flags follow the original ordered component properties, while internal and ignored members remain absent.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases Typed and Nest query/header parameter names and required flags follow the original ordered component properties, while internal and ignored members remain absent.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage Typed and Nest query/header parameter names and required flags follow the original ordered component properties, while internal and ignored members remain absent. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_decomposed_property_set =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    for (const [component, paths] of [
      [
        "IDecomposeQuery",
        [
          "/http_rich/swagger_parameters/decompose/typed-query",
          "/http_rich/swagger_parameters/decompose/nest-query",
        ],
      ],
      [
        "IDecomposeHeaders",
        [
          "/http_rich/swagger_parameters/decompose/typed-headers",
          "/http_rich/swagger_parameters/decompose/nest-headers",
        ],
      ],
    ] as const) {
      const schema = document.components.schemas![
        component
      ] as OpenApi.IJsonSchema.IObject;
      for (const path of paths) {
        const parameters: RichSwaggerParameterReader.IParameter[] =
          RichSwaggerParameterReader.parameters(document, path, "get");
        TestValidator.equals(
          `${path} names`,
          parameters.map((p) => p.name),
          Object.keys(schema.properties ?? {}),
        );
        TestValidator.equals(
          `${path} required`,
          parameters.filter((p) => p.required).map((p) => p.name),
          schema.required,
        );
        for (const omitted of ["internal", "ignored", "x-internal"])
          TestValidator.equals(
            `${path} omits ${omitted}`,
            parameters.some((p) => p.name === omitted),
            false,
          );
      }
    }
  };
