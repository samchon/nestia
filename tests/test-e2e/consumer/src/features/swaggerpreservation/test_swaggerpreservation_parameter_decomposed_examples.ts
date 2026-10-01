import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_decomposed_examples =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const query = (name: string) =>
      SwaggerParameterReader.parameters(
        document,
        "/swagger_only/parameters/example/query",
        "get",
      ).find((p) => p.name === name)!;
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
      "/swagger_only/parameters/example/headers",
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
