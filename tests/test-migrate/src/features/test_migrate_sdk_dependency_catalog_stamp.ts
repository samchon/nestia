import { OpenApiV3_1 } from "@typia/interface";

import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";
import { readTypeScriptCatalog } from "../internal/readTypeScriptCatalog";

/**
 * Verifies SDK-mode migration stamps this repository's catalog versions into
 * plain `package.json` specifiers, not only into a workspace catalog.
 *
 * A template can pin a version two ways, and the bundler owns both: a
 * `catalog:` reference its `pnpm-workspace.yaml` resolves, and a plain
 * specifier written straight into `dependencies`. The workspace-catalog path
 * has its own regression next door; this one covers the other path, which read
 * only the `samchon` catalog and so left the compiler frozen at whatever the
 * upstream SDK template last wrote. That shipped a generated project with
 * `ttsc` two minor versions behind the `@nestia/core` stamped beside it, which
 * stops being merely stale the moment the transform needs a newer ttsc API.
 *
 * The oracle is the tracked `pnpm-workspace.yaml` declaration rather than the
 * lockfile the bundler itself reads, so the assertion compares the output
 * against what this repository _declares_ instead of against the bundler's own
 * input.
 *
 * 1. Generate an SDK project from a minimal OpenAPI document.
 * 2. Assert every toolchain dependency the `typescript` catalog pins carries that
 *    pin.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated SDK toolchain dependencies equal the tracked TypeScript catalog declarations for ttsc and unplugin.
 * @evidence contracts/testing.md#independent-expectations The oracle reads the declared pnpm-workspace catalog rather than the bundler lock input or emitted manifest.
 * @evidence contracts/testing.md#distinguishing-cases Two dependency names and required declaration presence distinguish partial stamping from absent catalog entries.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
 */
export const test_migrate_sdk_dependency_catalog_stamp = (): void => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    DOCUMENT,
  ).sdk({
    keyword: true,
    simulate: true,
    e2e: true,
  });
  const parsed = JSON.parse(files["package.json"]!) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const declared: Record<string, string> = {
    ...(parsed.dependencies ?? {}),
    ...(parsed.devDependencies ?? {}),
  };
  const catalog: Record<string, string> = readTypeScriptCatalog();

  for (const name of ["ttsc", "@ttsc/unplugin"] as const) {
    const expected: string | undefined = catalog[name];
    if (expected === undefined)
      throw new Error(
        `The typescript catalog no longer pins ${name}; update this test with the catalog.`,
      );
    if (declared[name] !== expected)
      throw new Error(
        `Generated SDK package.json must pin ${name} at ${expected}, got ${declared[name]}.`,
      );
  }
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "SDK dependency catalog stamp fixture",
    version: "1.0.0",
  },
  paths: {
    "/bbs/articles": {
      get: {
        operationId: "bbs.articles.index",
        responses: {
          "200": {
            description: "Entire articles",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/IBbsArticle",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      IBbsArticle: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          title: {
            type: "string",
          },
        },
        required: ["id", "title"],
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
