import { OpenApi } from "@typia/interface";

import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";

/**
 * Verifies tuple tails repeat the additional-item type instead of emitting a
 * scalar TypeScript rest element.
 *
 * TypeScript tuple rest elements require array types; a scalar additional-item
 * type previously produced invalid generated syntax.
 *
 * 1. Compose the five authored tuple-tail forms directly.
 * 2. Compare their aliases with independent literal TypeScript expectations.
 *
 * @evidence contracts/testing.md#behavioral-verification Five generated tuple aliases retain repeated string/array/any tails, closed tuple and empty-prefix forms.
 * @evidence contracts/testing.md#independent-expectations The handwritten additionalItems type defines a TypeScript array rest element, with false closing the tuple.
 * @evidence contracts/testing.md#distinguishing-cases Scalar versus array item tails, true/false additionalItems and no prefix distinguish malformed rest syntax and inappropriate openness.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
 */
export const test_migrate_tuple_rest = (): void => {
  const files: Record<string, string> = new NestiaMigrateApplication({
    openapi: "3.2.0",
    "x-typia-emended-v12": true,
    info: { title: "Tuple rest", version: "1.0.0" },
    paths: {},
    components: {
      schemas: {
        TypedTail: {
          type: "array",
          prefixItems: [{ type: "number" }],
          additionalItems: { type: "string" },
        },
        ArrayTail: {
          type: "array",
          prefixItems: [{ type: "number" }],
          additionalItems: { type: "array", items: { type: "string" } },
        },
        AnyTail: {
          type: "array",
          prefixItems: [{ type: "number" }],
          additionalItems: true,
        },
        Closed: {
          type: "array",
          prefixItems: [{ type: "number" }],
          additionalItems: false,
        },
        EmptyPrefix: {
          type: "array",
          prefixItems: [],
          additionalItems: { type: "string" },
        },
      },
    },
  } satisfies OpenApi.IDocument).sdk({ simulate: false, e2e: false });
  for (const [name, type] of Object.entries({
    TypedTail: "[number,...string[]]",
    ArrayTail: "[number,...string[][]]",
    AnyTail: "[number,...any[]]",
    Closed: "[number]",
    EmptyPrefix: "[...string[]]",
  })) {
    const actual: string | undefined = files[`src/structures/${name}.ts`];
    if (actual?.replace(/\s+/g, "").includes(`type${name}=${type};`) !== true)
      throw new Error(`Unexpected ${name} tuple: ${actual}`);
  }
};
