import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies nest-mode controllers and e2e tests import DTOs by package name.
 *
 * In the monorepo template the DTO structures live in the api workspace package
 * while controllers and test features live in the backend package, so relative
 * `../api/structures/...` imports no longer resolve. The programmers must
 * reference the api package by its name (`@ORGANIZATION/PROJECT-api`, which
 * `renameSlug` rewrites to `<slug>-api`), keeping DTO clauses type-only and
 * merged into a single import statement per module.
 *
 * 1. Generate a nest project with package slug `fixture`.
 * 2. Assert the controller imports its DTO types through a single type-only
 *    `fixture-api` clause and keeps no relative structure imports.
 * 3. Assert the e2e feature imports the api default export and its DTO types from
 *    `fixture-api` without deep `lib/structures` paths.
 */
export const test_migrate_nest_dto_package_import = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.nest({
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  } satisfies INestiaMigrateConfig);

  const controller: string | undefined =
    files[
      "packages/backend/src/controllers/bbs/articles/BbsArticlesController.ts"
    ];
  if (controller === undefined)
    throw new Error("Missing generated controller file.");
  const controllerImports: string[] = controller
    .split("\n")
    .filter((line) => line.includes(`from "fixture-api"`));
  if (controllerImports.length !== 1)
    throw new Error(
      "The controller must import DTOs through a single fixture-api clause.",
    );
  if (controllerImports[0]!.startsWith("import type ") === false)
    throw new Error("The controller's DTO import must be type-only.");
  for (const name of ["IBbsArticle", "IAttachmentFile"])
    if (controllerImports[0]!.includes(name) === false)
      throw new Error(`The controller must import ${name} from fixture-api.`);
  if (controller.includes("api/structures"))
    throw new Error("The controller must not import DTOs by relative path.");

  const e2e: string | undefined =
    files["packages/backend/test/features/api/test_api_bbs_articles_post.ts"];
  if (e2e === undefined) throw new Error("Missing generated e2e feature.");
  if (e2e.includes(`import api from "fixture-api";`) === false)
    throw new Error("The e2e feature must import the api package default.");
  if (
    /^import type \{[^}]*IBbsArticle[^}]*\} from "fixture-api";$/m.test(e2e) ===
    false
  )
    throw new Error("The e2e feature must import DTO types from fixture-api.");
  if (e2e.includes("fixture-api/lib/structures"))
    throw new Error("The e2e feature must not use deep lib/structures paths.");
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "DTO package import fixture",
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
