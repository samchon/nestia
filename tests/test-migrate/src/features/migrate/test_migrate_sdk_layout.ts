import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies sdk-mode generation keeps its single-package layout and does not
 * leak the monorepo layout of nest mode.
 *
 * The nest mode moved to the pnpm monorepo template, and several programmers
 * (api, e2e, import) now branch on the generation mode. The sdk template is
 * still a single package, so the generated SDK, DTO and e2e files must sit
 * under `src/` and `test/` of one package and none under `packages/`: an
 * accidental leak of the monorepo paths would reshape migrated SDK projects and
 * strand their build scripts.
 *
 * 1. Generate an sdk project with the e2e tests on from a synthetic OpenAPI
 *    document.
 * 2. Assert the manifest, the module, the DTO, the functional and the e2e files
 *    the document produces sit at their single-package locations.
 * 3. Assert no key uses the monorepo roots, and that turning the e2e tests off
 *    removes the e2e features.
 *
 * @evidence contracts/testing.md#behavioral-verification It generates an SDK project and asserts the files that depend on the document sit at their single-package locations, that no key is rooted at `packages/` or `pnpm-workspace.yaml`, and that the e2e features appear only when requested, so a leak of the monorepo paths or a mode-blind programmer is detected.
 * @evidence contracts/testing.md#independent-expectations The single-package layout is the contract of sdk mode: the SDK functions mirror the route path under `src/functional`, each schema is a file under `src/structures`, each operation has an e2e feature under `test/features/api`, and the monorepo layout is the nest mode of the sibling `test_migrate_nest_monorepo_layout`; the expected keys are written literally from the document, not from a snapshot of the current output.
 * @evidence contracts/testing.md#distinguishing-cases The generated files of the document, the absent monorepo roots and the e2e option on and off are separate assertions; the pinned template's own static files are not listed, since their content and compilation belong to the template and to the shared `test-e2e` migration batch compile step, and file contents are owned by the neighboring tests.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_sdk_layout = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const config = (e2e: boolean): INestiaMigrateConfig => ({
    keyword: true,
    simulate: true,
    e2e,
    package: "fixture",
  });

  const keys: string[] = Object.keys(app.sdk(config(true)));
  const missing: string[] = EXPECTED.filter(
    (key) => keys.includes(key) === false,
  );
  if (missing.length !== 0)
    throw new Error(
      ["Missing single-package SDK files:", ...missing].join("\n"),
    );
  const monorepo: string[] = keys.filter(
    (key) => key.startsWith("packages/") || key === "pnpm-workspace.yaml",
  );
  if (monorepo.length !== 0)
    throw new Error(
      ["Monorepo paths leaked into sdk mode:", ...monorepo].join("\n"),
    );

  const silent: string[] = Object.keys(app.sdk(config(false))).filter((key) =>
    key.startsWith("test/features/"),
  );
  if (silent.length !== 0)
    throw new Error(
      ["e2e features were generated without e2e:", ...silent].join("\n"),
    );
};

const EXPECTED: string[] = [
  "package.json",
  "src/index.ts",
  "src/module.ts",
  "src/structures/IAttachmentFile.ts",
  "src/structures/IBbsArticle.ts",
  "src/functional/index.ts",
  "src/functional/bbs/index.ts",
  "src/functional/bbs/articles/index.ts",
  "test/features/api/test_api_bbs_articles_get.ts",
  "test/features/api/test_api_bbs_articles_post.ts",
];

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "SDK layout fixture",
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
