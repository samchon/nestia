import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies SDK-mode migration emits a pnpm-native project template.
 *
 * The migrated SDK is a standalone package, so its manifest, scripts, help
 * output, and README must agree on one package manager. A bundled lockfile
 * cannot be reused because migrate stamps the current Nestia version into the
 * manifest; the first pnpm install must create the matching lockfile instead.
 *
 * 1. Generate an SDK project from a minimal OpenAPI document.
 * 2. Assert its package metadata and user-facing commands select pnpm.
 * 3. Assert pnpm's lockfile is neither pre-bundled nor ignored.
 */
export const test_migrate_sdk_pnpm_template = (): void => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    DOCUMENT,
  ).sdk({
    keyword: true,
    simulate: true,
    e2e: true,
  });
  const packageJson = JSON.parse(files["package.json"]!);
  if (
    typeof packageJson.packageManager !== "string" ||
    packageJson.packageManager.startsWith("pnpm@") === false
  )
    throw new Error("Generated SDK package.json must select pnpm.");

  const scripts: string[] = Object.values(packageJson.scripts ?? {});
  if (scripts.some((script) => /\b(?:npm|npx|yarn)\b/.test(script)))
    throw new Error("Generated SDK scripts must use pnpm exclusively.");
  if (scripts.some((script) => script.includes("pnpm")) === false)
    throw new Error("Generated SDK scripts are missing pnpm commands.");

  for (const key of ["README.md", "hello.js"] as const) {
    const content: string = files[key]!;
    if (content.includes("pnpm") === false)
      throw new Error(`${key} must document pnpm commands.`);
    if (/\b(?:npm|npx|yarn) (?:install|run|start|test)\b/.test(content))
      throw new Error(`${key} contains a non-pnpm command.`);
  }

  if (files["pnpm-lock.yaml"] !== undefined)
    throw new Error("Generated SDK must not reuse the template lockfile.");
  if (
    files[".gitignore"]!.split(/\r?\n/).some(
      (line) => line.trim() === "pnpm-lock.yaml",
    )
  )
    throw new Error(
      "Generated SDK must track its pnpm lockfile after install.",
    );
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "SDK pnpm template fixture",
    version: "1.0.0",
  },
  paths: {
    "/health": {
      get: {
        responses: {
          "200": {
            description: "Healthy service",
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
