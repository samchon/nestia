import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";
import fs from "fs";
import path from "path";

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
 * @evidence contracts/testing.md#behavioral-verification SDK generation must stamp direct ttsc/unplugin dependency specifiers from the repository TypeScript catalog.
 * @evidence contracts/testing.md#independent-expectations The independently declared workspace catalog supplies expected dependency ranges, rather than the bundler-read lockfile.
 * @evidence contracts/testing.md#distinguishing-cases Two direct toolchain dependencies exercise plain-specifier stamping; this case does not verify preservation of uncataloged versions.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry calls test_migrate_sdk_dependency_catalog_stamp as a portable generator unit; provided fixture documents are inputs and this function starts no compiler, consumer installation or host.
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

/**
 * Read the `typescript` catalog of the repository's `pnpm-workspace.yaml`,
 * resolving the YAML anchors it uses to share one version across the ttsc
 * packages (`ttsc: &ttsc ^0.20.0` followed by `'@ttsc/unplugin': *ttsc`).
 *
 * Parsing only this one block keeps the test free of a YAML dependency the test
 * workspace does not declare, and the shape is stable: the catalog is a flat
 * map of name to specifier.
 */
const readTypeScriptCatalog = (): Record<string, string> => {
  const content: string = fs.readFileSync(
    path.resolve(process.cwd(), "../../pnpm-workspace.yaml"),
    "utf8",
  );
  const lines: string[] = content.split(/\r?\n/);
  const start: number = lines.findIndex((line) => line === "  typescript:");
  if (start < 0)
    throw new Error("pnpm-workspace.yaml has no `typescript` catalog.");

  const output: Record<string, string> = {};
  const anchors: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (/^\s*$/.test(line)) continue;
    if (line.startsWith("    ") === false) break;
    const match: RegExpMatchArray | null = line.match(
      /^ {4}(?:'([^']+)'|"([^"]+)"|([^:\s]+)): (?:&(\S+) )?(\S+)$/,
    );
    if (match === null) continue;
    const name: string = match[1] ?? match[2] ?? match[3]!;
    const anchor: string | undefined = match[4];
    const raw: string = match[5]!;
    const value: string = raw.startsWith("*") ? anchors[raw.slice(1)]! : raw;
    if (anchor !== undefined) anchors[anchor] = value;
    output[name] = value;
  }
  return output;
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
