import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrated controllers write each named example back as the value it
 * names.
 *
 * OpenAPI names examples with Example Objects, whose `value` holds the value,
 * and nestia now writes `@SwaggerExample` named examples that way (#1649).
 * Documents from earlier nestia versions held the values themselves, and a
 * `$ref` to a reusable example arrives resolved to its Example Object. The
 * controller must declare `SwaggerExample.*(key, value)` with the value in all
 * three cases, so a nestia document survives the round trip.
 *
 * 1. Migrate the fixture document nestia generated, whose create route declares
 *    named request-body and response examples.
 * 2. Migrate a document holding raw named values and `$ref` Example Objects.
 * 3. Assert every generated `SwaggerExample` call carries the value, never the
 *    Example Object around it.
 */
export const test_migrate_nest_named_examples = (document: unknown): void => {
  const fixture: string = controller(
    NestiaMigrateApplication.assert(document as OpenApiV3_1.IDocument),
    "packages/backend/src/controllers/articles/ArticlesController.ts",
  );
  expect(fixture, [
    `SwaggerExample.Parameter("minimal", {`,
    `SwaggerExample.Response("published", {`,
  ]);
  if (fixture.includes("value:"))
    throw new Error("A named example kept its Example Object wrapper.");

  const legacy: string = controller(
    NestiaMigrateApplication.assert(DOCUMENT),
    "packages/backend/src/controllers/items/ItemsController.ts",
  );
  expect(legacy, [
    `SwaggerExample.Parameter("raw", {`,
    `name: "raw-body"`,
    `SwaggerExample.Parameter("referenced", {`,
    `name: "referenced-body"`,
    `SwaggerExample.Response("raw", {`,
    `name: "raw-response"`,
  ]);
  if (legacy.includes("value:"))
    throw new Error("A named example kept its Example Object wrapper.");
};

const controller = (app: NestiaMigrateApplication, file: string): string => {
  const content: string | undefined = app.nest({
    keyword: false,
    simulate: false,
    e2e: false,
    package: "fixture",
  })[file];
  if (content === undefined) throw new Error(`Missing ${file}.`);
  return content;
};

const expect = (content: string, needles: string[]): void => {
  for (const needle of needles)
    if (content.includes(needle) === false)
      throw new Error(`Generated controller lacks ${JSON.stringify(needle)}.`);
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Named examples fixture",
    version: "1.0.0",
  },
  paths: {
    "/items": {
      post: {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IItem" },
              examples: {
                raw: { name: "raw-body" },
                referenced: { $ref: "#/components/examples/Referenced" },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IItem" },
                examples: {
                  raw: { name: "raw-response" },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      IItem: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
    examples: {
      Referenced: {
        summary: "A reusable example",
        value: { name: "referenced-body" },
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
