import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies the keyword=false patch targets the backend's nestia.config.ts.
 *
 * The monorepo template moved nestia.config.ts from the project root into
 * `packages/backend`, so the `config.keyword === false` patch has to rewrite
 * the file at its new key. Patching the old root key would silently add a stray
 * file whose `keyword: true` stays in effect, generating an SDK whose calling
 * convention contradicts the migrated controllers.
 *
 * 1. Generate a nest project with `keyword: false`.
 * 2. Assert `packages/backend/nestia.config.ts` carries `keyword: false`.
 * 3. Assert no root-level nestia.config.ts key exists.
 * 4. Generate with `keyword: true` and assert the config keeps its default.
 */
export const test_migrate_nest_keyword_config_path = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const config = (keyword: boolean): INestiaMigrateConfig => ({
    keyword,
    simulate: true,
    e2e: false,
    package: "fixture",
  });

  const positional: Record<string, string> = app.nest(config(false));
  const patched: string | undefined =
    positional["packages/backend/nestia.config.ts"];
  if (patched === undefined)
    throw new Error("Missing packages/backend/nestia.config.ts.");
  if (patched.includes("keyword: false") === false)
    throw new Error("keyword: false must be patched into the backend config.");
  if (positional["nestia.config.ts"] !== undefined)
    throw new Error("No root-level nestia.config.ts may be generated.");

  const keyword: Record<string, string> = app.nest(config(true));
  if (
    keyword["packages/backend/nestia.config.ts"]?.includes("keyword: true") !==
    true
  )
    throw new Error("keyword: true must keep the template's default config.");
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Keyword config path fixture",
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
          body: {
            type: "string",
          },
        },
        required: ["id", "title", "body"],
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
