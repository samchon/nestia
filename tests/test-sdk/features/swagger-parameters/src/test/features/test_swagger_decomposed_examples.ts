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
 * @evidence contracts/testing.md#behavioral-verification Checks decomposed default and named examples are projected onto the correct query/header properties and absent members gain no example.
 * @evidence contracts/testing.md#independent-expectations Authored object examples supply the exact member values; named OpenAPI examples wrap each projected member in value.
 * @evidence contracts/testing.md#distinguishing-cases Keyword and page positives are paired with missing size and missing locale controls, detecting invented examples.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-parameters controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-parameters test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_examples retain keyword and page positives are paired with missing size and missing locale controls, detecting invented examples.
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
