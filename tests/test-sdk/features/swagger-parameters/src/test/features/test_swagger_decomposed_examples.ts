import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification Query keyword/page examples must split exact default/named values under value, size stays without examples, header tenant is samchon and locale has no own example property.
 * @evidence contracts/testing.md#independent-expectations Authored decorator objects prescribe nestia/typia/ttsc/3/7/samchon and omitted members independently of decomposition output.
 * @evidence contracts/testing.md#distinguishing-cases Default versus named, present versus omitted member and query versus header distinguish projection and named Example Object wrapping.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_examples export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_examples documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_decomposed_examples = async (): Promise<void> => {
  const document: OpenApi.IDocument = await SwaggerParameterReader.document();
  const query = (name: string) =>
    SwaggerParameterReader.parameters(document, "/example/query", "get").find(
      (p) => p.name === name,
    )!;
  const examples = (name: string): string =>
    SwaggerParameterReader.canonical({
      example: query(name).example,
      examples: query(name).examples,
    });

  TestValidator.equals(
    "keyword",
    examples("keyword"),
    SwaggerParameterReader.canonical({
      example: "nestia",
      examples: { typia: { value: "typia" }, paged: { value: "ttsc" } },
    }),
  );
  TestValidator.equals(
    "page",
    examples("page"),
    SwaggerParameterReader.canonical({
      example: 3,
      examples: { paged: { value: 7 } },
    }),
  );
  TestValidator.equals(
    "size",
    examples("size"),
    SwaggerParameterReader.canonical({}),
  );

  const headers = SwaggerParameterReader.parameters(
    document,
    "/example/headers",
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
