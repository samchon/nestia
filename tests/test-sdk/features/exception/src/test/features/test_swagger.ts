import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies @TypedException emits the correct Swagger response-schema $ref for
 * each status code, including the 5XX wildcard and the oneOf union.
 *
 * Pins five distinct branches of `IApiExceptionVariable` serialization
 * (201/400/404/428/5XX) plus a oneOf union and decorator-supplied `examples`
 * literals. A regression in the Go-side exception serializer — emitting
 * `INotFound` under a different key, dropping the 5XX wildcard, or switching
 * the union to `anyOf` — would silently fail this test; the `oneOf` is a
 * deliberate OpenAPI 3.1 choice that consumers depend on.
 *
 * 1. Read the generated `swagger.json` from the SDK output.
 * 2. For each (code, schema-name) pair assert `$ref` ends with the schema.
 * 3. Assert the `/union` route's response uses `oneOf` and that the `examples`
 *    literals from the decorator carry summary / description / value triples
 *    through to the OpenAPI output.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated exception responses must retain five specific schema refs, the exact three-way oneOf, explicit Nest bad-request description/ref and both authored example triples.
 * @evidence contracts/testing.md#independent-expectations ExceptionController explicitly declares201 success,400/404/428/5XX exceptions, three IExceptional union members and literal example objects. Those authored declarations supply handwritten expected refs/values independently of emitted output.
 * @evidence contracts/testing.md#distinguishing-cases Exact and wildcard statuses, oneOf union, built-in Nest exception and two named examples distinguish serialization branches. The test inspects these selected fields rather than certifying every schema body or actual thrown response.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native exception metadata and real Swagger composition must produce the serialized document consumed here; a local type-table unit cannot certify these final refs and examples.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  for (const [key, value] of [
    [201, "IBbsArticle"],
    [400, "TypeGuardErrorany"],
    [404, "INotFound"],
    [428, "IUnprocessibleEntity"],
    ["5XX", "IInternalServerError"],
  ] as const)
    TestValidator.equals(
      key.toString(),
      content.paths["/exception/{section}/typed"].post.responses[key].content[
        "application/json"
      ].schema.$ref,
      `#/components/schemas/${value}`,
    );
  TestValidator.equals(
    "union",
    content.paths["/exception/{section}/union"].get.responses[428].content[
      "application/json"
    ].schema,
    {
      oneOf: [
        { $ref: "#/components/schemas/IExceptional.Something" },
        { $ref: "#/components/schemas/IExceptional.Nothing" },
        { $ref: "#/components/schemas/IExceptional.Everything" },
      ],
    },
  );
  TestValidator.equals(
    "nestjs bad request description",
    content.paths["/exception/nestjs-bad-request"].get.responses[400]
      .description,
    "invalid parameter provided",
  );
  TestValidator.equals(
    "nestjs bad request schema",
    content.paths["/exception/nestjs-bad-request"].get.responses[400].content[
      "application/json"
    ].schema.$ref,
    "#/components/schemas/BadRequestException",
  );

  TestValidator.equals(
    "examples",
    content.paths["/exception/{section}/typed"].post.responses[400].content[
      "application/json"
    ].examples,
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
