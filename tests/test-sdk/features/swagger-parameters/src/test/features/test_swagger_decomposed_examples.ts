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
