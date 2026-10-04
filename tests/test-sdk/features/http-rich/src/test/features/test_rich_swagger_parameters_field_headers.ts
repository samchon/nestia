import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "typia";

import { RichSwaggerParameterReader } from "./internal/RichSwaggerParameterReader";

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
 * @evidence contracts/testing.md#behavioral-verification The authored field route retains exact path/query/header order, required UUID trace and optional string header; the combined route retains its header object alongside the field header.
 * @evidence contracts/testing.md#independent-expectations The original authored DTO/decorator input and literal schema/example values establish expected constraints. Existing component-to-parameter comparisons retain their original relationship oracle and literal cells rather than treating compile success as correctness.
 * @evidence contracts/testing.md#distinguishing-cases The authored field route retains exact path/query/header order, required UUID trace and optional string header; the combined route retains its header object alongside the field header.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP entry compiles one authored producer and one generated consumer, and discovers this matching case through DynamicExecutor. It reads the actual generated Swagger document; no independent feature compiler or host is started.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed public compiler, Nest application and SDK generation produce the document under test; no resolver hook or patched emitted output supplies it.
 * @evidence contracts/e2e.md#shared-execution One installed producer and generated consumer supply this case's document together with every compatible rich case; the shared entry retains its individual failure.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader scopes actual paths and schemas to this unchanged authored scenario, keeping unrelated shared scenarios out of its whole-document null oracle. Assertions do not mutate the shared file; each read owns its parsed document, and the runner owns fixture teardown.
 * @evidence contracts/e2e.md#preserved-coverage The authored field route retains exact path/query/header order, required UUID trace and optional string header; the combined route retains its header object alongside the field header. Original document-only preparation remains generated and compiled without adding random transport requests. The three authored-metadata isolation/fallback cases now have direct unit owners.
 */
export const test_rich_swagger_parameters_field_headers =
  async (): Promise<void> => {
    const document: OpenApi.IDocument =
      await RichSwaggerParameterReader.document();
    const summary = (path: string) =>
      RichSwaggerParameterReader.parameters(document, path, "get").map((p) =>
        RichSwaggerParameterReader.canonical({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: p.schema,
        }),
      );

    TestValidator.equals(
      "field route",
      summary("/http_rich/swagger_parameters/field/{id}"),
      [
        RichSwaggerParameterReader.canonical({
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        }),
        RichSwaggerParameterReader.canonical({
          name: "limit",
          in: "query",
          required: true,
          schema: { type: "string" },
        }),
        RichSwaggerParameterReader.canonical({
          name: "x-trace",
          in: "header",
          required: true,
          schema: { type: "string", format: "uuid" },
        }),
        RichSwaggerParameterReader.canonical({
          name: "x-optional",
          in: "header",
          required: false,
          schema: { type: "string" },
        }),
      ],
    );
    TestValidator.equals(
      "combined route",
      RichSwaggerParameterReader.parameters(
        document,
        "/http_rich/swagger_parameters/field/{id}/combined",
        "get",
      ).map((p) => `${p.in}:${p.name}`),
      ["path:id", "header:x-trace", "header:x-tenant", "header:x-locale"],
    );
  };
