import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies an object with both declared properties and an object
 * `additionalProperties` keeps its properties beside the index signature.
 *
 * The writer tested `properties.length` on the properties record, which is
 * always undefined, so such an object became its index signature alone and
 * every declared property disappeared (#1738).
 *
 * 1. Migrate a document whose `IMixed` declares `id` and `name` and admits boolean
 *    additional properties.
 * 2. Assert its DTO keeps the required `id`, the optional `name`, and the index
 *    signature.
 */
export const test_migrate_additional_properties = (): void => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    DOCUMENT,
  ).sdk({ simulate: false, e2e: false, package: "fixture" });
  const content: string | undefined = files["src/structures/IMixed.ts"];
  if (content === undefined) throw new Error("Missing IMixed.");
  const flat: string = content.replace(/\s+/g, " ");
  for (const needle of [
    "id: number",
    "name?: string | undefined",
    "[key: string]: boolean",
  ])
    if (flat.includes(needle) === false)
      throw new Error(`IMixed misses ${needle}:\n${content}`);
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Additional properties fixture", version: "1.0.0" },
  components: {
    schemas: {
      IMixed: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
        required: ["id"],
        additionalProperties: { type: "boolean" },
      },
    },
  },
  paths: {
    "/mixed": {
      get: {
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IMixed" },
              },
            },
          },
        },
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
