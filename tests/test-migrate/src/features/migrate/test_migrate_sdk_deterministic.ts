import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrating one document twice writes the same files, byte for byte,
 * whatever the number of routes.
 *
 * The SDK's start example picked a route at random, so a regeneration rewrote
 * the file with another route and a committed SDK changed on every run.
 *
 * 1. Migrate a document holding several routes as an SDK and as a Nest project,
 *    with the simulator and the e2e tests on, several times.
 * 2. Assert every run writes the same file names and the same contents.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates one document with six routes as SDK and nest projects nine times and asserts the file names and contents are identical, which fails when the start example picks a random route.
 * @evidence contracts/testing.md#independent-expectations Determinism is the property: every run is compared with the first run, not with an expected file.
 * @evidence contracts/testing.md#distinguishing-cases Six routes make an accidental match of nine runs improbable, and the SDK and nest outputs are compared separately.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the E2E `test-migrate-e2e` boundary.
 */
export const test_migrate_sdk_deterministic = (): void => {
  const generate = (): Record<string, string>[] => {
    const app: NestiaMigrateApplication =
      NestiaMigrateApplication.assert(DOCUMENT);
    const props = { simulate: true, e2e: true, package: "fixture" };
    return [app.sdk(props), app.nest(props)];
  };
  const first: string = JSON.stringify(generate());
  for (let i: number = 0; i < 8; ++i)
    if (JSON.stringify(generate()) !== first)
      throw new Error("Two migrations of one document differ.");
};

const operation = (id: string): OpenApiV3_1.IOperation => ({
  operationId: `items.${id}`,
  responses: {
    "200": {
      description: "OK",
      content: { "application/json": { schema: { type: "string" } } },
    },
  },
});

const DOCUMENT: OpenApiV3_1.IDocument = {
  openapi: "3.1.0",
  info: { title: "Deterministic fixture", version: "1.0.0" },
  paths: Object.fromEntries(
    ["a", "b", "c", "d", "e", "f"].map((name) => [
      `/${name}`,
      { get: operation(name) } satisfies OpenApiV3_1.IPath,
    ]),
  ),
};
