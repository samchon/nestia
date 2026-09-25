import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies a migrated SDK's simulator validates the headers an operation
 * declares, as its server would.
 *
 * The simulation programmer had a branch for headers but never listed them, so
 * the simulate function validated the parameters, the query, and the body, and
 * let invalid headers through (#1721).
 *
 * 1. Migrate a document whose operation declares a required header, with
 *    `simulate` on, in SDK and NestJS modes.
 * 2. Assert the simulate function asserts `connection.headers`.
 */
export const test_migrate_simulate_headers = (): void => {
  for (const mode of ["sdk", "nest"] as const) {
    const files: Record<string, string> = NestiaMigrateApplication.assert(
      DOCUMENT,
    )[mode]({
      keyword: false,
      simulate: true,
      e2e: false,
      package: "fixture",
    });
    const functional: string = Object.entries(files)
      .filter(([key]) => key.includes("functional"))
      .map(([, content]) => content.replace(/\s+/g, "").replace(/,\)/g, ")"))
      .join("\n");
    if (
      functional.includes(
        "assert.headers(()=>typia.assert(connection.headers))",
      ) === false
    )
      throw new Error(
        `${mode}: the simulator does not validate the headers:\n${functional}`,
      );
  }
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Simulated headers", version: "1.0.0" },
  paths: {
    "/items": {
      get: {
        parameters: [
          {
            name: "x-id",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "ok",
            content: { "application/json": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
  components: {},
} as unknown as OpenApiV3_1.IDocument;
