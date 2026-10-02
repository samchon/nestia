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
 * @evidence contracts/testing.md#behavioral-verification Checks status-specific and 5XX response refs, oneOf union, BadRequestException metadata and examples.
 * @evidence contracts/testing.md#independent-expectations The authored exception decorators define status, schema names, examples and descriptions; OpenAPI local references encode those names.
 * @evidence contracts/testing.md#distinguishing-cases Explicit statuses, wildcard status, union members, framework exceptions and supplied examples retain independent checks.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks status-specific and 5XX response refs, oneOf union, BadRequestException metadata and examples. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Explicit statuses, wildcard status, union members, framework exceptions and supplied examples retain independent checks. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
