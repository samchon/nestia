import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

/**
 * Verifies `@SwaggerExample.Parameter()` examples of a decomposed object are
 * split across its parameters.
 *
 * With `decompose: false` the object parameter carries the decorator's
 * `example` and `examples`; decomposition, the default, used to drop both
 * (#1642). Each parameter must take its own member of every example, a named
 * one as an Example Object of the member (#1649), and a parameter whose member
 * an example lacks takes nothing from that example.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the query parameters split the default and named examples by key.
 * 3. Assert the header object's default example is split the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Default and named object examples split by member; the missing size and locale controls retain no example fields.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases Default and named object examples split by member; the missing size and locale controls retain no example fields.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage Default and named object examples split by member; the missing size and locale controls retain no example fields. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_decomposed_examples =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    const query = (name: string) =>
      RichSwaggerParameterReader.parameters(
        document,
        "/http_rich/swagger_parameters/example/query",
        "get",
      ).find((p) => p.name === name)!;
    const examples = (name: string): string =>
      RichSwaggerParameterReader.canonical({
        example: query(name).example,
        examples: query(name).examples,
      });

    TestValidator.equals(
      "keyword",
      examples("keyword"),
      RichSwaggerParameterReader.canonical({
        example: "nestia",
        examples: { typia: { value: "typia" }, paged: { value: "ttsc" } },
      }),
    );
    TestValidator.equals(
      "page",
      examples("page"),
      RichSwaggerParameterReader.canonical({
        example: 3,
        examples: { paged: { value: 7 } },
      }),
    );
    TestValidator.equals(
      "size",
      examples("size"),
      RichSwaggerParameterReader.canonical({}),
    );

    const headers = RichSwaggerParameterReader.parameters(
      document,
      "/http_rich/swagger_parameters/example/headers",
      "get",
    );
    TestValidator.equals(
      "x-tenant",
      headers.find((p) => p.name === "x-tenant")?.example,
      "samchon",
    );
    TestValidator.equals(
      "x-locale",
      Object.prototype.hasOwnProperty.call(
        headers.find((p) => p.name === "x-locale")!,
        "example",
      ),
      false,
    );
  };
