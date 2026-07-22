import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies SDK migration emits a runnable starter for a valid empty Paths Object.
 *
 * Why:
 * OpenAPI permits a document to declare no operations, so migration must not select
 * a nonexistent route while constructing the template's `test/start.ts` command.
 *
 * 1. Migrate a minimal OpenAPI 3.1 document whose paths object is empty.
 * 2. Assert its retained starter contains no route-specific imports or calls.
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
