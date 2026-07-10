import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies sdk-mode generation keeps its single-package file layout.
 *
 * The nest mode moved to the pnpm monorepo template, and several programmers
 * (api, e2e, import) now branch on the generation mode. The sdk template is
 * still the pinned single-package nestia-sdk-template, so its output keys are
 * regression-locked here: any accidental leak of the monorepo paths (or a
 * template re-pin) must fail loudly instead of silently reshaping migrated SDK
 * projects.
 *
 * 1. Generate an sdk project from a synthetic OpenAPI document.
 * 2. Compare the sorted key set against the snapshot taken before the monorepo
 *    migration.
 */
export const test_migrate_sdk_key_snapshot = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.sdk({
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  } satisfies INestiaMigrateConfig);

  const actual: string[] = Object.keys(files).sort();
  if (JSON.stringify(actual) !== JSON.stringify(SNAPSHOT))
    throw new Error(
      [
        "The sdk output keys changed:",
        `- expected: ${JSON.stringify(SNAPSHOT, null, 2)}`,
        `- actual: ${JSON.stringify(actual, null, 2)}`,
      ].join("\n"),
    );
};

const SNAPSHOT: string[] = [
  ".gitignore",
  ".vscode/launch.json",
  ".vscode/settings.json",
  "LICENSE",
  "README.md",
  "hello.js",
  "package.json",
  "prettier.config.js",
  "rollup.config.js",
  "src/HttpError.ts",
  "src/IConnection.ts",
  "src/functional/bbs/articles/index.ts",
  "src/functional/bbs/index.ts",
  "src/functional/index.ts",
  "src/index.ts",
  "src/module.ts",
  "src/structures/IAttachmentFile.ts",
  "src/structures/IBbsArticle.ts",
  "swagger.json",
  "test/TestGlobal.ts",
  "test/features/api/test_api_bbs_articles_get.ts",
  "test/features/api/test_api_bbs_articles_post.ts",
  "test/index.ts",
  "test/start.ts",
  "test/swagger.ts",
  "test/tsconfig.json",
  "test/utils/ArgumentParser.ts",
  "tsconfig.json",
];

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "SDK key snapshot fixture",
    version: "1.0.0",
  },
  paths: {
    "/bbs/articles": {
      post: {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IBbsArticle.IStore",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Newly archived article",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/IBbsArticle",
                },
              },
            },
          },
        },
      },
      get: {
        responses: {
          "200": {
            description: "Attached files of every article",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/IAttachmentFile",
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
          body: {
            type: "string",
          },
          files: {
            type: "array",
            items: {
              $ref: "#/components/schemas/IAttachmentFile",
            },
          },
        },
        required: ["id", "title", "body", "files"],
      },
      "IBbsArticle.IStore": {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          body: {
            type: "string",
          },
          files: {
            type: "array",
            items: {
              $ref: "#/components/schemas/IAttachmentFile",
            },
          },
        },
        required: ["title", "body", "files"],
      },
      IAttachmentFile: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          url: {
            type: "string",
            format: "uri",
          },
        },
        required: ["name", "url"],
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
