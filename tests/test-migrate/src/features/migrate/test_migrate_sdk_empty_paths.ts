import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies SDK migration emits a runnable starter for a valid empty Paths
 * Object.
 *
 * Why: OpenAPI permits a document to declare no operations, so migration must
 * not select a nonexistent route while constructing the template's
 * `test/start.ts` command.
 *
 * 1. Migrate a minimal OpenAPI 3.1 document whose paths object is empty.
 * 2. Assert its retained starter contains no route-specific imports or calls.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates a document with an empty paths object and asserts the retained starter and the functional module exist and the starter has no route call or test connection.
 * @evidence contracts/testing.md#independent-expectations A document without operations has no route to call, so a starter that names one is wrong, whatever the template does; compiling the result is owned by the shared `test-e2e` migration batch compile step.
 * @evidence contracts/testing.md#distinguishing-cases The empty document is the boundary case beside the routed documents of the other migrate tests.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_sdk_empty_paths = (): void => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    EMPTY_PATHS_DOCUMENT,
  ).sdk({
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  } satisfies INestiaMigrateConfig);
  const starter: string | undefined = files["test/start.ts"];
  if (starter === undefined) throw new Error("Missing SDK starter file.");
  if (files["src/functional/index.ts"] === undefined)
    throw new Error("Missing SDK functional module.");
  if (starter.includes("TestGlobal") === true)
    throw new Error("An empty SDK starter must not require a test connection.");
  if (starter.includes("functional") === true)
    throw new Error("An empty SDK starter must not call a route.");
};

const EMPTY_PATHS_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Empty Paths",
    version: "1.0.0",
  },
  paths: {},
} satisfies OpenApiV3_1.IDocument;
