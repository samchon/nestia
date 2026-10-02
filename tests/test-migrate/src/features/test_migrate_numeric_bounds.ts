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
 * 2. Assert each property's generated type.
 *
 * @evidence contracts/testing.md#behavioral-verification SDK DTO generation must preserve exclusive bounds and each supported integer format instead of narrowing all integers to int32.
 * @evidence contracts/testing.md#independent-expectations Literal numeric constraints in the input establish Minimum/ExclusiveMinimum/ExclusiveMaximum tags, and unformatted integer generation uses the documented int64 migration default.
 * @evidence contracts/testing.md#distinguishing-cases OpenAPI 3.0 boolean exclusivity and 3.1 numeric exclusivity, zero bounds, explicit int32/int64 and unformatted integers expose version and width differences.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry calls test_migrate_numeric_bounds as a portable generator unit; provided fixture documents are inputs and this function starts no compiler, consumer installation or host.
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
        },
        required: ["a", "b"],
      },
    },
  },
} as unknown as OpenApiV3.IDocument;
