import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrated controllers write named examples of older documents back as
 * the value they name.
 *
 * OpenAPI names examples with Example Objects, whose `value` holds the value,
 * and nestia now writes `@SwaggerExample` named examples that way (#1649).
 * Documents from earlier nestia versions held the values themselves, and a
 * `$ref` to a reusable example arrives resolved to its Example Object. The
 * controller must declare `SwaggerExample.*(key, value)` with the value in all
 * three cases, and with OpenAPI 3.2's `dataValue` in place of `value`. An
 * Example Object that only links its value (`externalValue`) or serializes it
 * (`serializedValue`) names nothing a decorator can hold, and is left out
 * rather than written as the object.
 *
 * 1. Migrate a document holding raw named values, `$ref` Example Objects, and
 *    `dataValue`, `externalValue`, and `serializedValue` Example Objects.
 * 2. Assert every generated `SwaggerExample` call carries the value, never the
 *    Example Object around it, and none is written for the linked or the
 *    serialized one.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates a document of raw named values, a `$ref` Example Object, and `dataValue`, `externalValue`, and `serializedValue` objects, and asserts each generated `SwaggerExample` carries the value and none is written for the linked or serialized ones.
 * @evidence contracts/testing.md#independent-expectations An Example Object holds its value under `value` or `dataValue`, and a link or a serialization names nothing a decorator can hold; the expected calls are literal.
 * @evidence contracts/testing.md#distinguishing-cases Raw, referenced, data, linked, and serialized forms are five separate examples of one operation; the round trip with a nestia-generated document is owned by the shared `test-e2e` migration batch.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_nest_named_examples_legacy = (): void => {
  const legacy: string = controller(
    NestiaMigrateApplication.assert(DOCUMENT as OpenApiV3_1.IDocument),
    "packages/backend/src/controllers/items/ItemsController.ts",
  );
  expect(legacy, [
    `SwaggerExample.Parameter("raw",{name:"raw-body",},)`,
    `SwaggerExample.Parameter("referenced",{name:"referenced-body",},)`,
    `SwaggerExample.Response("raw",{name:"raw-response",},)`,
    `SwaggerExample.Response("data",{name:"data-response",},)`,
  ]);
  if (legacy.includes("value:") || legacy.includes("externalValue"))
    throw new Error("A named example kept its Example Object wrapper.");
  for (const key of ["linked", "serialized"])
    if (legacy.includes(`SwaggerExample.Response("${key}"`))
      throw new Error(`The ${key} example was written without its value.`);
};

/** The generated controller, without whitespace, whose layout is the printer's. */
const controller = (app: NestiaMigrateApplication, file: string): string => {
  const content: string | undefined = app.nest({
    keyword: false,
    simulate: false,
    e2e: false,
    package: "fixture",
  })[file];
  if (content === undefined) throw new Error(`Missing ${file}.`);
  return content.replace(/\s+/g, "");
};

const expect = (content: string, needles: string[]): void => {
  for (const needle of needles)
    if (content.includes(needle) === false)
      throw new Error(`Generated controller lacks ${JSON.stringify(needle)}.`);
};

/**
 * A document holding named examples as earlier nestia versions wrote them, the
 * raw values themselves, next to Example Objects of every form. The raw ones
 * are not Example Objects, which is the point, so the literal cannot claim the
 * type.
 */
const DOCUMENT: unknown = {
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
                  linked: {
                    summary: "hosted elsewhere",
                    externalValue: "https://example.com/item.json",
                  },
                  data: { dataValue: { name: "data-response" } },
                  serialized: { serializedValue: '{"name":"serialized"}' },
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
};
