import { OpenApiV3_1 } from "@typia/interface";

import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "../../../../packages/migrate/lib";

/**
 * Verifies migrated NestJS projects follow the pnpm monorepo template layout.
 *
 * The nestia-start template was restructured into a pnpm monorepo whose backend
 * application (`packages/backend`) and SDK library (`packages/api`) are
 * separate workspace packages, and every nest-mode programmer emission path
 * moved with it. A silent regression to the legacy single-package `src/api/...`
 * layout would scatter generated files outside the workspace packages, where
 * the bundled template neither compiles nor links them.
 *
 * 1. Generate a nest project from a synthetic OpenAPI document.
 * 2. Assert the module, controller, DTO, barrel, functional, and e2e files land in
 *    their monorepo locations.
 * 3. Assert the DTO barrel re-exports every generated structure file.
 * 4. Assert no generated key uses the legacy single-package `src/` or `test/`
 *    roots.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct Nest output contains every literal controller/module/DTO/barrel/functional/E2E path and no legacy source/test roots.
 * @evidence contracts/testing.md#independent-expectations The handwritten operation/DTO references plus monorepo package contract establish the expected file families independently of emitted keys.
 * @evidence contracts/testing.md#distinguishing-cases Both DTO barrel members and all required file families prevent empty-layout success; forbidden roots catch old placement.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
 */
export const test_migrate_nest_monorepo_layout = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.nest({
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  } satisfies INestiaMigrateConfig);

  const expected: string[] = [
    "pnpm-workspace.yaml",
    "packages/backend/nestia.config.ts",
    "packages/backend/src/MyModule.ts",
    "packages/backend/src/controllers/bbs/articles/BbsArticlesController.ts",
    "packages/backend/test/features/api/test_api_bbs_articles_post.ts",
    "packages/api/src/structures/IAttachmentFile.ts",
    "packages/api/src/structures/IBbsArticle.ts",
    "packages/api/src/structures/index.ts",
    "packages/api/src/functional/index.ts",
    "packages/api/src/functional/bbs/articles/index.ts",
  ];
  const missing: string[] = expected.filter((key) => files[key] === undefined);
  if (missing.length !== 0)
    throw new Error(
      ["Missing monorepo template files:", ...missing].join("\n"),
    );

  const barrel: string = files["packages/api/src/structures/index.ts"]!;
  for (const name of ["IAttachmentFile", "IBbsArticle"])
    if (barrel.includes(`export * from "./${name}";`) === false)
      throw new Error(`The DTO barrel must re-export ${name}.`);

  const legacy: string[] = Object.keys(files).filter(
    (key) => key.startsWith("src/") || key.startsWith("test/"),
  );
  if (legacy.length !== 0)
    throw new Error(
      ["Legacy single-package paths must not be generated:", ...legacy].join(
        "\n",
      ),
    );
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Monorepo layout fixture",
    version: "1.0.0",
  },
  paths: {
    "/bbs/articles": {
      post: {
        operationId: "bbs.articles.store",
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
        },
        required: ["title", "body"],
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
