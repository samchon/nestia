import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification The authored literal-union path, string-array query and optional literal-union query retain their exact parameter schema, order and requiredness.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases The authored literal-union path, string-array query and optional literal-union query retain their exact parameter schema, order and requiredness.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage The authored literal-union path, string-array query and optional literal-union query retain their exact parameter schema, order and requiredness. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_vanilla_field_shapes =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    TestValidator.equals(
      "vanilla route",
      RichSwaggerParameterReader.parameters(
        document,
        "/http_rich/swagger_parameters/field/vanilla/{kind}",
        "get",
      ).map((p) =>
        RichSwaggerParameterReader.canonical({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: p.schema,
        }),
      ),
      [
        RichSwaggerParameterReader.canonical({
          name: "kind",
          in: "path",
          required: true,
          schema: { oneOf: [{ const: "x" }, { const: "y" }] },
        }),
        RichSwaggerParameterReader.canonical({
          name: "ids",
          in: "query",
          required: true,
          schema: { type: "array", items: { type: "string" } },
        }),
        RichSwaggerParameterReader.canonical({
          name: "mode",
          in: "query",
          required: false,
          schema: { oneOf: [{ const: "a" }, { const: "b" }] },
        }),
      ],
    );
  };
