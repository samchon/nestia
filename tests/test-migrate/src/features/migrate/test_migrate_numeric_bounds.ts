import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3, OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrated DTOs keep exclusive numeric bounds and an integer type as
 * wide as the schema's.
 *
 * The emended schema migrate reads holds `exclusiveMinimum` and
 * `exclusiveMaximum` as the bounds themselves, as OpenAPI 3.1 does, with
 * OpenAPI 3.0's boolean form converted into them; migrate read them as booleans
 * beside `minimum` / `maximum`, so every exclusive bound was lost or took the
 * wrong value. It also narrowed every integer to int32 (#1684).
 *
 * 1. Migrate a 3.1 and a 3.0 document holding exclusive bounds and integer
 *    formats.
 * 2. Assert each property's generated type, including a 3.0 bound whose boolean
 *    exclusivity flag is false, which stays inclusive.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates 3.1 and 3.0 documents with exclusive bounds and integer formats and asserts each property's generated type.
 * @evidence contracts/testing.md#independent-expectations The bounds and formats are those OpenAPI defines, and each expected type is written literally from the document.
 * @evidence contracts/testing.md#distinguishing-cases The 3.1 numeric form, the 3.0 boolean form set to true and to false, and the integer widths are separate properties, so a reader that makes every 3.0 bound exclusive, or none, is detected.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_numeric_bounds = (): void => {
  expect(structure(DOCUMENT_3_1), [
    `a:number&tags.ExclusiveMinimum<0>;`,
    `b:number&tags.Type<"int64">&tags.Minimum<1>&tags.ExclusiveMaximum<100>;`,
    `c:number&tags.Type<"int64">;`,
    `d:number&tags.Type<"int32">;`,
    `e:number&tags.Type<"int64">;`,
  ]);
  expect(structure(DOCUMENT_3_0), [
    `a:number&tags.ExclusiveMinimum<0>;`,
    `b:number&tags.Type<"int64">&tags.ExclusiveMaximum<10>;`,
    `c:number&tags.Minimum<5>;`,
  ]);
};

const structure = (document: unknown): string => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    document as OpenApiV3_1.IDocument,
  ).sdk({
    keyword: true,
    simulate: false,
    e2e: false,
    package: "fixture",
  });
  const content: string | undefined = Object.entries(files).find(([key]) =>
    key.endsWith("IBounds.ts"),
  )?.[1];
  if (content === undefined)
    throw new Error(
      `Missing IBounds structure: ${JSON.stringify(Object.keys(files))}`,
    );
  return content.replace(/\s+/g, "");
};

const expect = (content: string, needles: string[]): void => {
  for (const needle of needles)
    if (content.includes(needle) === false)
      throw new Error(
        `Generated IBounds lacks ${JSON.stringify(needle)}:\n${content}`,
      );
};

const paths = (): Record<string, unknown> => ({
  "/bounds": {
    get: {
      responses: {
        200: {
          description: "bounds",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IBounds" },
            },
          },
        },
      },
    },
  },
});

const DOCUMENT_3_1 = {
  openapi: "3.1.0",
  info: { title: "Bounds", version: "1.0.0" },
  paths: paths(),
  components: {
    schemas: {
      IBounds: {
        type: "object",
        properties: {
          a: { type: "number", exclusiveMinimum: 0 },
          b: { type: "integer", minimum: 1, exclusiveMaximum: 100 },
          c: { type: "integer", format: "int64" },
          d: { type: "integer", format: "int32" },
          e: { type: "integer" },
        },
        required: ["a", "b", "c", "d", "e"],
      },
    },
  },
} as unknown as OpenApiV3_1.IDocument;

const DOCUMENT_3_0 = {
  openapi: "3.0.3",
  info: { title: "Bounds", version: "1.0.0" },
  paths: paths(),
  components: {
    schemas: {
      IBounds: {
        type: "object",
        properties: {
          a: { type: "number", minimum: 0, exclusiveMinimum: true },
          b: { type: "integer", maximum: 10, exclusiveMaximum: true },
          c: { type: "number", minimum: 5, exclusiveMinimum: false },
        },
        required: ["a", "b", "c"],
      },
    },
  },
} as unknown as OpenApiV3.IDocument;
