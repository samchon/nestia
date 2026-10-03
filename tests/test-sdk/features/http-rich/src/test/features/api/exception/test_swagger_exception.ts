import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies @TypedException emits the correct Swagger response-schema $ref for
 * each status code, including the 5XX wildcard and the oneOf union.
 *
 * Pins five distinct branches of `IApiExceptionVariable` serialization
 * (201/400/404/428/5XX) plus a oneOf union and decorator-supplied `examples`
 * literals. A regression in the Go-side exception serializer — emitting
 * `ExceptionINotFound` under a different key, dropping the 5XX wildcard, or
 * switching the union to `anyOf` — would silently fail this test; the `oneOf`
 * is a deliberate OpenAPI 3.1 choice that consumers depend on.
 *
 * 1. Read the generated `swagger.json` from the SDK output.
 * 2. For each (code, schema-name) pair assert `$ref` ends with the schema.
 * 3. Assert the `/union` route's response uses `oneOf` and that the `examples`
 *    literals from the decorator carry summary / description / value triples
 *    through to the OpenAPI output.
 *
 * @evidence contracts/testing.md#behavioral-verification Fresh generated Swagger responses retain exact201/400/404/428/5XX references, oneOf exception alternatives, Nest BadRequestException description/schema and every original named example literal.
 * @evidence contracts/testing.md#independent-expectations Status codes and literal schemas come from authored decorators and declared return types. The distinct wildcard, concrete status and union keys follow their public OpenAPI contracts rather than generated snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Concrete response references contrast wildcard5XX and union428; decorated TypeGuardError examples retain both title and content entries, while Nest BadRequestException preserves its distinct description and schema.
 * @evidence contracts/testing.md#execution-ownership The matching case runs in the installed shared HTTP consumer after public generation from the compiled authored exception controller; it creates no per-case compiler or host.
 * @evidence contracts/e2e.md#necessary-boundary Native decorator metadata, Nest reflection and the public Swagger writer must agree on status and schema ownership. This freshly emitted document connection cannot be established by direct composer inputs alone.
 * @evidence contracts/e2e.md#shared-execution The shared producer, installed consumer, generation and application serve this case together with all existing HTTP scenarios; no former exception feature build or backend starts.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities separate exception metadata from other scenarios. The case only reads the fresh document; the shared runner owns application and private output cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Every original reference, union member, Nest error description and example assertion remains after reversible identity/path changes. Beautify option semantics remain in migration writer units; no original textual formatting assertion existed here.
 */
export const test_swagger_exception = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../swagger.json",
      "utf8",
    ),
  );
  for (const [key, value] of [
    [201, "ExceptionIBbsArticle"],
    [400, "TypeGuardErrorany"],
    [404, "ExceptionINotFound"],
    [428, "ExceptionIUnprocessibleEntity"],
    ["5XX", "ExceptionIInternalServerError"],
  ] as const)
    TestValidator.equals(
      key.toString(),
      content.paths["/http_rich/exception/{section}/typed"].post.responses[key]
        .content["application/json"].schema.$ref,
      `#/components/schemas/${value}`,
    );
  TestValidator.equals(
    "union",
    content.paths["/http_rich/exception/{section}/union"].get.responses[428]
      .content["application/json"].schema,
    {
      oneOf: [
        { $ref: "#/components/schemas/ExceptionIExceptional.Something" },
        { $ref: "#/components/schemas/ExceptionIExceptional.Nothing" },
        { $ref: "#/components/schemas/ExceptionIExceptional.Everything" },
      ],
    },
  );
  TestValidator.equals(
    "nestjs bad request description",
    content.paths["/http_rich/exception/nestjs-bad-request"].get.responses[400]
      .description,
    "invalid parameter provided",
  );
  TestValidator.equals(
    "nestjs bad request schema",
    content.paths["/http_rich/exception/nestjs-bad-request"].get.responses[400]
      .content["application/json"].schema.$ref,
    "#/components/schemas/BadRequestException",
  );

  TestValidator.equals(
    "examples",
    content.paths["/http_rich/exception/{section}/typed"].post.responses[400]
      .content["application/json"].examples,
    {
      title: {
        summary: "title",
        description: "Wrong type of the title",
        value: {
          name: "BadRequestException",
          method: "TypedBody",
          path: "$input.title",
          expected: "string",
          value: 123,
          message: "invalid type",
        },
      },
      content: {
        summary: "content",
        description: "content of the article",
        value: {
          name: "BadRequestException",
          method: "TypedBody",
          path: "$input.title",
          expected: "string",
          value: 123,
          message: "invalid type",
        },
      },
    },
  );
};
