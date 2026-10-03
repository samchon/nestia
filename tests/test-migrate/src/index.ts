import {
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import cp from "child_process";
import fs from "fs";
import path from "path";
import type { IValidation } from "typia";

import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
  NestiaMigrateFileArchiver,
} from "../../../packages/migrate/lib";
import { test_migrate_api_accessor_collision } from "./features/test_migrate_api_accessor_collision";
import { test_migrate_nest_named_examples } from "./features/test_migrate_nest_named_examples";
import { EMPTY_PATHS_DOCUMENT } from "./features/test_migrate_sdk_empty_paths";
import { compileMigrationPrograms } from "./internal/compileMigrationPrograms";
import { test_migrate_generated_project_inputs } from "./internal/test_migrate_generated_project_inputs";
import { test_migrate_simulate_throws } from "./internal/test_migrate_simulate_throws";

const TEST_ROOT: string = process.cwd();
const ROOT: string = path.resolve(TEST_ROOT, "../..");
const FIXTURE: string = path.join(TEST_ROOT, "fixture");
const GENERATED: string = path.join(TEST_ROOT, ".generated");
const SWAGGER: string = path.join(GENERATED, "swagger.json");
const OUTPUT: string = path.join(GENERATED, "output");
const NODE: string = process.execPath;
Object.assign(
  process.env,
  require("../../../scripts/run-tests.cjs").resolveTestEnvironment(
    ROOT,
    process.env,
  ),
);
const TTSC_CACHE_DIR: string = process.env.TTSC_CACHE_DIR!;

type SwaggerDocument =
  | SwaggerV2.IDocument
  | OpenApiV3.IDocument
  | OpenApiV3_1.IDocument
  | OpenApiV3_2.IDocument;

interface IScenario {
  name: string;
  file: string;
}

const measure =
  (title: string) =>
  async (task: () => Promise<void>): Promise<number> => {
    process.stdout.write(`  - ${title}: `);
    const time: number = Date.now();
    await task();
    console.log(`${(Date.now() - time).toLocaleString()} ms`);
    return Date.now() - time;
  };

const spawn = (cwd: string, args: string[]): void => {
  cp.execFileSync(args[0]!, args.slice(1), {
    stdio: "inherit",
    cwd,
    env: {
      ...process.env,
      TTSC_CACHE_DIR,
    },
  });
};

const generateSwagger = (): Promise<number> =>
  measure("fixture-swagger")(() => {
    spawn(FIXTURE, [
      NODE,
      path.join(ROOT, "packages", "cli", "bin", "index.js"),
      "swagger",
      "--project",
      "tsconfig.json",
    ]);
    return Promise.resolve();
  });

const readDocument = async (file: string): Promise<SwaggerDocument> =>
  JSON.parse(await fs.promises.readFile(file, "utf8")) as SwaggerDocument;

const assertFixtureSwagger = (document: SwaggerDocument): void => {
  const current = document as OpenApiV3_1.IDocument;
  const text: string = JSON.stringify(document);
  const paths: string[] = Object.keys(current.paths ?? {});
  const operations: number = paths
    .map(
      (accessor) =>
        Object.keys(current.paths?.[accessor] ?? {}).filter((method) =>
          METHODS.has(method),
        ).length,
    )
    .reduce((a, b) => a + b, 0);
  const schemas: number = Object.keys(current.components?.schemas ?? {}).length;
  const security: string[] = Object.keys(
    current.components?.securitySchemes ?? {},
  );

  const errors: string[] = [];
  if (current.openapi !== "3.1.0") errors.push("OpenAPI 3.1 fixture expected");
  if (paths.length < 7) errors.push("fixture must contain several paths");
  if (operations < 10)
    errors.push("fixture must contain at least 10 operations");
  if (schemas < 20) errors.push("fixture must contain rich schemas");
  if (text.includes('"oneOf"') === false)
    errors.push("fixture must contain union schemas");
  if (text.includes("multipart/form-data") === false)
    errors.push("fixture must contain multipart/form-data");
  if (text.includes("text/plain") === false)
    errors.push("fixture must contain text/plain");
  if (
    security.includes("bearer") === false ||
    security.includes("apiKey") === false
  )
    errors.push("fixture must contain bearer and apiKey security schemes");
  if (errors.length !== 0)
    throw new Error(`Invalid fixture swagger:\n${errors.join("\n")}`);
};

const execute = async (
  mode: "nest" | "sdk",
  config: INestiaMigrateConfig,
  scenario: IScenario,
  document: SwaggerDocument,
): Promise<string> => {
  const title: string = `${scenario.name}-${mode}-${
    config.keyword ? "keyword" : "positional"
  }`;
  const directory = path.join(OUTPUT, title);
  await measure(title)(async () => {
    const result: IValidation<NestiaMigrateApplication> =
      await NestiaMigrateApplication.validate(document);
    if (result.success === false)
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
      );

    const app: NestiaMigrateApplication = result.data;
    const files: Record<string, string> =
      mode === "nest"
        ? app.nest({
            ...config,
            package: title,
          })
        : app.sdk({
            ...config,
            package: title,
          });
    const invalidPaths: string[] = Object.keys(files).filter(
      (key) =>
        key.startsWith("/") || key.startsWith("./") || key.includes("//"),
    );
    if (invalidPaths.length > 0)
      throw new Error(`Invalid file paths: ${invalidPaths.join(", ")}`);
    for (const key of Object.keys(files)) {
      const content: string | undefined = files[key];
      if (key.endsWith("tsconfig.json") && content !== undefined)
        files[key] = content.replace(
          /^\s*\{\s*"transform":\s*"typescript-transform-paths"\s*\},\r?\n/gm,
          "",
        );
    }

    await NestiaMigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: async (file, content) =>
        fs.promises.writeFile(file, content, "utf-8"),
      root: directory,
      files,
    });
  });
  return directory;
};

/**
 * Generates the controller fixture's Swagger document, exercises migration
 * assertions, and compiles the generated NestJS and SDK projects in both
 * calling conventions. The generated files remain available for diagnosis.
 */
export const main = async (): Promise<void> => {
  if (fs.existsSync(GENERATED))
    await fs.promises.rm(GENERATED, { recursive: true });
  await fs.promises.mkdir(OUTPUT, { recursive: true });

  await generateSwagger();

  const scenarios: IScenario[] = [
    {
      name: "fixture",
      file: SWAGGER,
    },
  ];
  const filter = (() => {
    const only = process.argv.findIndex((str) => str === "--only");
    if (only !== -1 && process.argv.length > only + 1)
      return (str: string) => str.includes(process.argv[only + 1]!);
    return () => true;
  })();

  for (const scenario of scenarios) {
    if (filter(scenario.name) === false) continue;
    const document: SwaggerDocument = await readDocument(scenario.file);
    assertFixtureSwagger(document);
    test_migrate_api_accessor_collision(document);
    test_migrate_nest_named_examples(document);
    const programs: string[] = [];
    programs.push(
      await execute(
        "sdk",
        {
          keyword: true,
          simulate: true,
          e2e: true,
        },
        {
          name: "empty-paths",
          file: "",
        },
        EMPTY_PATHS_DOCUMENT,
      ),
    );
    for (const [mode, keyword] of [
      ["nest", true],
      ["nest", false],
      ["sdk", true],
      ["sdk", false],
    ] as const)
      programs.push(
        await execute(
          mode,
          {
            keyword,
            simulate: true,
            e2e: true,
          },
          scenario,
          document,
        ),
      );
    let compiled: string = "";
    await test_migrate_generated_project_inputs(
      path.join(OUTPUT, `${scenario.name}-sdk-positional`),
      TTSC_CACHE_DIR,
    );
    await measure("combined-generated-program")(async () => {
      compiled = await compileMigrationPrograms(programs, TTSC_CACHE_DIR);
    });
    await test_migrate_simulate_throws(
      path.join(compiled, `${scenario.name}-sdk-positional`, "src"),
    );
  }
};

const METHODS: Set<string> = new Set([
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
]);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
