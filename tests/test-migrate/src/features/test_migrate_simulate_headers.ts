import { OpenApiV3_1 } from "@typia/interface";

import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";

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
 *
 * @evidence contracts/testing.md#behavioral-verification SDK and Nest writer output validates connection headers against a declared type and adds typed random headers to generated E2E requests.
 * @evidence contracts/testing.md#independent-expectations The authored required x-id UUID header defines the expected explicit header type and generated request payload.
 * @evidence contracts/testing.md#distinguishing-cases Both modes and validation-versus-payload checks distinguish omitted validation, inference of optional connection types and omitted E2E headers.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
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
    if (
      /assert\.headers\(\(\)=>typia\.assert<[\w$.]+>\(connection\.headers\)\)/.test(
        functional,
      ) === false
    )
      throw new Error(
        `${mode}: the simulator does not validate the headers by a type:\n${functional}`,
      );
    const e2e: string = flatten((key) => key.includes("test_api_"));
    if (
      /headers:\{\.\.\.connection\.headers,\.\.\.typia\.random<[\w$.]+>\(\)\}/.test(
        e2e,
      ) === false
    )
      throw new Error(`${mode}: the e2e test sends no headers:\n${e2e}`);
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
