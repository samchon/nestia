import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

/**
 * Verifies a decomposed parameter is deprecated exactly when its property is.
 *
 * A `@deprecated` property gets `deprecated: true` in typia's object schema,
 * and OpenAPI defines the same field on the Parameter Object. Decomposition
 * used to drop it (#1642), so the deprecation that `decompose: false` documents
 * vanished once the object was split.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the deprecated query and header properties become deprecated
 *    parameters.
 * 3. Assert every other decomposed parameter carries no `deprecated` field.
 *
 * @evidence contracts/testing.md#behavioral-verification Exactly the named deprecated query/header members carry true; every other decomposed parameter must omit deprecated.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases Exactly the named deprecated query/header members carry true; every other decomposed parameter must omit deprecated.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage Exactly the named deprecated query/header members carry true; every other decomposed parameter must omit deprecated. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_decomposed_deprecated =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    for (const [path, deprecated] of [
      ["/http_rich/swagger_parameters/example/query", "page"],
      ["/http_rich/swagger_parameters/decompose/typed-headers", "x-legacy"],
    ] as const)
      for (const p of RichSwaggerParameterReader.parameters(
        document,
        path,
        "get",
      ))
        TestValidator.equals(
          `${path} ${p.name} deprecated`,
          p.deprecated,
          p.name === deprecated ? true : undefined,
        );
  };
