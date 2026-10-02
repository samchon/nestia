import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "@typia/interface";

/**
 * Verifies tuple tails repeat the additional-item type instead of emitting a
 * scalar TypeScript rest element.
 *
 * @evidence contracts/testing.md#behavioral-verification SDK generation emits DTO aliases for tuple schemas, and exact alias assertions distinguish an invalid scalar rest element from a repeating item type while retaining the fixed prefix.
 * @evidence contracts/testing.md#independent-expectations TypeScript represents a repeated tuple tail as a rest array; literals describe number followed by strings, arrays of strings, unconstrained items, or no tail independently of the schema writer.
 * @evidence contracts/testing.md#distinguishing-cases Typed string and array-valued tails, an unconstrained tail, a closed tuple and an empty fixed prefix exercise both branches and prevent flattening array-valued additional items.
 * @evidence contracts/testing.md#execution-ownership This portable unit constructs NestiaMigrateApplication with an emended document and calls sdk directly through the test-migrate entry; it installs no consumer and starts no compiler or host.
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
