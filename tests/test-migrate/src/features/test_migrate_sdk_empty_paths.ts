import { OpenApiV3_1 } from "@typia/interface";

import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "../../../../packages/migrate/lib";

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
 * @evidence contracts/testing.md#behavioral-verification An empty OpenAPI paths object still yields starter and functional barrel without connection or route-specific code.
 * @evidence contracts/testing.md#independent-expectations The authored zero-operation document is valid; no operation exists to supply a route-specific starter request.
 * @evidence contracts/testing.md#distinguishing-cases Required nonempty file families plus forbidden TestGlobal/functional references distinguish usable empty-project output from missing or spurious route output.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
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

export const EMPTY_PATHS_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Empty Paths",
    version: "1.0.0",
  },
  paths: {},
} satisfies OpenApiV3_1.IDocument;
