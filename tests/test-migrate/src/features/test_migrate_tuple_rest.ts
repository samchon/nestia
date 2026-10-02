import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "@typia/interface";

/**
 * Verifies tuple tails repeat the additional-item type instead of emitting a
 * scalar TypeScript rest element.
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
