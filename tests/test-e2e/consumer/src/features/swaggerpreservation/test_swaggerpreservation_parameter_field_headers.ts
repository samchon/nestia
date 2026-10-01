import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

/**
 * Verifies field-named `@Headers("name")` parameters appear in the operation.
 *
 * The operation composer listed path, query, query-object, and header-object
 * parameters but never field headers (#1641), so a header the endpoint requires
 * was missing from the document. A field header must be listed with its
 * declared schema and optionality, next to a header object when the route has
 * both.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the field route lists path, query, and both field headers, with the
 *    optional header not required.
 * 3. Assert the combined route lists the field header and the decomposed header
 *    object.
 *
 * @evidence contracts/testing.md#behavioral-verification Field route must emit exact ordered path/query/required UUID header/optional string header summaries; combined route contains path, field and two object header keys.
 * @evidence contracts/testing.md#independent-expectations Authored field parameter types/optionality prescribe the handwritten four exact canonical summaries and combined key list independently of current output.
 * @evidence contracts/testing.md#distinguishing-cases Field header versus decomposed header object, required versus optional and path/query neighbors distinguish omitted-field and misplaced-schema defects.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered in the shared installed consumer after the common native producer and actual Swagger generation; rejected assertions fail its report and empty discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All document cases read the existing rich Swagger artifact and reuse its one installation, producer, generation and consumer program; this case opens no application or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader resolves the caller-owned rich document without mutating it; canonicalization creates strings and downgrade works on copies. The shared entry owns artifact and backend cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original source constraints, literal pins and positive/negative document controls remain in this named consumer. Manual composition, fallback and isolation stay with their direct unit owners; default decomposition dispatch and incompatible configuration connections remain pending.
 */
export const test_swaggerpreservation_parameter_field_headers =
  async (): Promise<void> => {
    const document: OpenApi.IDocument = await SwaggerParameterReader.document();
    const summary = (path: string) =>
      SwaggerParameterReader.parameters(document, path, "get").map((p) =>
        SwaggerParameterReader.canonical({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: p.schema,
        }),
      );

    TestValidator.equals(
      "field route",
      summary("/swagger_only/parameters/field/{id}"),
      [
        SwaggerParameterReader.canonical({
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        }),
        SwaggerParameterReader.canonical({
          name: "limit",
          in: "query",
          required: true,
          schema: { type: "string" },
        }),
        SwaggerParameterReader.canonical({
          name: "x-trace",
          in: "header",
          required: true,
          schema: { type: "string", format: "uuid" },
        }),
        SwaggerParameterReader.canonical({
          name: "x-optional",
          in: "header",
          required: false,
          schema: { type: "string" },
        }),
      ],
    );
    TestValidator.equals(
      "combined route",
      SwaggerParameterReader.parameters(
        document,
        "/swagger_only/parameters/field/{id}/combined",
        "get",
      ).map((p) => `${p.in}:${p.name}`),
      ["path:id", "header:x-trace", "header:x-tenant", "header:x-locale"],
    );
  };
