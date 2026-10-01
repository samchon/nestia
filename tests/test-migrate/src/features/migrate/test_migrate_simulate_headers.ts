import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies a migrated SDK's simulator validates the headers an operation
 * declares against their type, and its e2e test sends them, as its server would
 * require.
 *
 * The simulation programmer had a branch for headers but never listed them, so
 * the simulate function let invalid headers through (#1721). Listed, it
 * asserted `connection.headers` by the expression's own type, which is optional
 * with optional members, so any headers passed; and the generated e2e test sent
 * none (#1739).
 *
 * 1. Migrate a document whose operation declares a required header, with
 *    `simulate` and `e2e` on, in SDK and NestJS modes.
 * 2. Assert the simulate function asserts `connection.headers` by a type.
 * 3. Assert the e2e test spreads random headers into the connection.
 * 4. Assert a second operation that declares no header gets neither, so each is
 *    written exactly once.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates an operation with a required header in SDK and nest modes and asserts the simulate function asserts `connection.headers` by a type and the e2e test spreads random headers.
 * @evidence contracts/testing.md#independent-expectations The generated code must validate what the server requires, so the expected fragments follow from the declared header.
 * @evidence contracts/testing.md#distinguishing-cases The simulate function and the e2e test are separate consumers of the header in two modes, and a second operation without headers is the adjacent negative case: the validation and the random headers must each appear exactly once, so a programmer that writes them for every operation is detected.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_simulate_headers = (): void => {
  for (const mode of ["sdk", "nest"] as const) {
    const files: Record<string, string> = NestiaMigrateApplication.assert(
      DOCUMENT,
    )[mode]({
      keyword: false,
      simulate: true,
      e2e: true,
      package: "fixture",
    });
    const flatten = (filter: (key: string) => boolean): string =>
      Object.entries(files)
        .filter(([key]) => filter(key))
        .map(([, content]) =>
          content.replace(/\s+/g, "").replace(/,\)/g, ")").replace(/,\}/g, "}"),
        )
        .join("\n");
    const functional: string = flatten((key) => key.includes("functional"));
    const validated: number = (
      functional.match(
        /assert\.headers\(\(\)=>typia\.assert<[\w$.]+>\(connection\.headers\)\)/g,
      ) ?? []
    ).length;
    if (validated !== 1)
      throw new Error(
        `${mode}: ${validated} operations validate their headers by a type, not only the one declaring them:\n${functional}`,
      );
    const e2e: string = flatten((key) => key.includes("test_api_"));
    const sent: number = (
      e2e.match(
        /headers:\{\.\.\.connection\.headers,\.\.\.typia\.random<[\w$.]+>\(\)\}/g,
      ) ?? []
    ).length;
    if (sent !== 1)
      throw new Error(
        `${mode}: the e2e tests send random headers ${sent} times, not once:\n${e2e}`,
      );
  }
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Simulated headers", version: "1.0.0" },
  paths: {
    "/plain": {
      get: {
        responses: {
          200: {
            description: "ok",
            content: { "application/json": { schema: { type: "string" } } },
          },
        },
      },
    },
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
