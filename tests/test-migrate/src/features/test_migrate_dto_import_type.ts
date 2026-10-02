import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrated projects import DTO types with `import type`.
 *
 * Migrated DTO files declare pure types, and every generated module — SDK
 * functions, NestJS controllers, e2e suites, and the DTO files themselves —
 * references them only in type positions. The import programmer therefore must
 * print type-only clauses; a plain value import would make bundlers and Node.js
 * load pure type modules at runtime and breaks `verbatimModuleSyntax`
 * consumers.
 *
 * 1. Build a synthetic OpenAPI document whose operations reference DTO schemas,
 *    including a DTO that references another DTO.
 * 2. Generate both the SDK and the NestJS projects from it.
 * 3. Assert every DTO import in every generated module is type-only, while runtime
 *    library imports such as `typia` stay value imports.
 */
export const test_migrate_dto_import_type = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const config: INestiaMigrateConfig = {
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  };
  assertProject("sdk", app.sdk(config));
  assertProject("nest", app.nest(config));
};

function assertProject(title: string, files: Record<string, string>): void {
  const violations: string[] = [];
  let count: number = 0;
  let runtime: boolean = false;
  for (const [key, content] of Object.entries(files)) {
    if (key.endsWith(".ts") === false) continue;
    const insideStructures: boolean = key.includes("structures/");
    for (const match of content.matchAll(/^import[^;]*from "[^"]+";/gm)) {
      const statement: string = match[0];
      const specifier: string = statement.match(/from "([^"]+)";$/)![1]!;
      if (specifier === "typia" && statement.startsWith("import typia")) {
        // typia.assert/random calls survive to runtime — the value import
        // must not be swept up by the type-only DTO clause.
        runtime = true;
        continue;
      }
      const dto: boolean =
        specifier.includes("structures/") ||
        (insideStructures && specifier.startsWith("./"));
      if (dto === false) continue;
      ++count;
      if (statement.startsWith("import type ") === false)
        violations.push(`${title}/${key}: ${statement.split("\n")[0]}`);
    }
  }
  if (violations.length !== 0)
    throw new Error(
      ["Migrated DTO imports must be type-only:", ...violations].join("\n"),
    );
  if (count === 0)
    throw new Error(`The ${title} fixture must contain DTO imports.`);
  if (runtime === false)
    throw new Error(`The ${title} fixture must keep the typia value import.`);
}

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "DTO import type fixture",
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
