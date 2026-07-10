import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";
import { createRequire } from "node:module";
import path from "path";

/**
 * Verifies nest projects stamp nestia versions into the workspace catalogs.
 *
 * The monorepo template consumes every nestia package through the
 * `catalog:samchon` indirection of pnpm-workspace.yaml, so version stamping
 * moved from package.json dependency rewriting to catalog rewriting. Dependabot
 * compatibility requires explicit `@nestia/*` entries instead of YAML aliases,
 * and every one must track this repository's version without disturbing the
 * upstream catalog layout.
 *
 * 1. Generate a nest project from a synthetic OpenAPI document.
 * 2. Assert every Nestia catalog entry pins the current version explicitly.
 * 3. Assert the TypeScript and typia catalog entries keep caret versions.
 * 4. Assert package.json dependencies keep their `catalog:` indirections.
 */
export const test_migrate_nest_workspace_catalog_stamp = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.nest({
    keyword: true,
    simulate: true,
    e2e: false,
    package: "fixture",
  } satisfies INestiaMigrateConfig);

  const workspace: string | undefined = files["pnpm-workspace.yaml"];
  if (workspace === undefined)
    throw new Error("Missing pnpm-workspace.yaml in the nest output.");

  const { version } = createRequire(path.join(process.cwd(), "package.json"))(
    "@nestia/migrate/package.json",
  ) as { version: string };
  for (const name of [
    "@nestia/benchmark",
    "@nestia/core",
    "@nestia/e2e",
    "@nestia/fetcher",
    "@nestia/sdk",
    "nestia",
  ]) {
    const key: string = name.startsWith("@") ? `"${name}"` : name;
    if (workspace.includes(`${key}: ^${version}`) === false)
      throw new Error(
        `pnpm-workspace.yaml must stamp \`${key}: ^${version}\`.`,
      );
  }
  if (/^\s+ttsc: \^\d/m.test(workspace) === false)
    throw new Error("The ttsc catalog entry must keep a caret version.");
  if (/^\s+typescript: \^\d/m.test(workspace) === false)
    throw new Error("The typescript catalog entry must keep a caret version.");
  if (/^\s+typia: \^\d/m.test(workspace) === false)
    throw new Error("The typia catalog entry must keep a caret version.");

  const backend: string | undefined = files["packages/backend/package.json"];
  if (backend === undefined)
    throw new Error("Missing backend package.json in the nest output.");
  const parsed = JSON.parse(backend) as {
    dependencies: Record<string, string>;
  };
  if (parsed.dependencies["@nestia/core"] !== "catalog:samchon")
    throw new Error(
      "The backend @nestia/core dependency must keep its catalog reference.",
    );
  if (parsed.dependencies["fixture-api"] !== "workspace:^")
    throw new Error(
      "The backend api dependency must keep its workspace reference.",
    );
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Workspace catalog stamp fixture",
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
