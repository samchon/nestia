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
