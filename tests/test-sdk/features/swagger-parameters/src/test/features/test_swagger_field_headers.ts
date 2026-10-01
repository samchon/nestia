import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

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
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_field_headers export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native DTO/decorator/tag metadata and installed Swagger generation must emit the final document. Pure hand-built-schema assertions cannot establish that these authored type constraints survive the producer boundary.
 * @evidence contracts/e2e.md#shared-execution All generated-document cases consume the same native-produced swagger.json and share installation, producer/runtime compilation and feature backend. Each helper read adds no application or compiler preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads are anchored to this feature’s own output. Canonicalization creates strings without mutating inputs, and downgrades explicitly copy their source. The entry closes its backend and the harness removes its copied tree after execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_field_headers documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_field_headers = async (): Promise<void> => {
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

  TestValidator.equals("field route", summary("/field/{id}"), [
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
  ]);
  TestValidator.equals(
    "combined route",
    SwaggerParameterReader.parameters(
      document,
      "/field/{id}/combined",
      "get",
    ).map((p) => `${p.in}:${p.name}`),
    ["path:id", "header:x-trace", "header:x-tenant", "header:x-locale"],
  );
};
