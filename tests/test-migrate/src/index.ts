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
import { selectMigrateScenarios } from "./internal/selectMigrateScenarios";
import { test_migrate_entry_selection } from "./internal/test_migrate_entry_selection";
import { test_migrate_generated_project_inputs } from "./internal/test_migrate_generated_project_inputs";
import { test_migrate_installed_cli_resolution } from "./internal/test_migrate_installed_cli_resolution";
import { test_migrate_simulate_throws } from "./internal/test_migrate_simulate_throws";

const TEST_ROOT: string = path.resolve(__dirname, "..");
const ROOT: string = path.resolve(TEST_ROOT, "../..");
const FIXTURE_SOURCE: string = path.join(TEST_ROOT, "fixture");
const GENERATED: string = path.join(TEST_ROOT, ".generated");
const FIXTURE: string = path.join(GENERATED, "fixture");
const SWAGGER: string = path.join(GENERATED, ".generated", "swagger.json");
const OUTPUT: string = path.join(GENERATED, "output");
const NODE: string = process.execPath;
Object.assign(
  process.env,
  require("../../../config/testing/CompilerEnvironment.ts").resolveTestEnvironment(
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
      NODE_OPTIONS: "",
      NODE_PATH: "",
    },
  });
};

const generateSwagger = (cli: string): Promise<number> =>
  measure("fixture-swagger")(() => {
    spawn(FIXTURE, [NODE, cli, "swagger", "--project", "tsconfig.json"]);
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
 *
 * The root command may supply its fresh shared public installation. Standalone
 * execution prepares this workspace's graph itself. File-owned addresses make
 * both invocation paths select the same fixture and generated-output owner.
 *
 * The original fixture inputs are copied under the generated owner. Only its
 * inherited tsconfig pathname is rebased; the configuration's relative Swagger
 * output and all controller/DTO contents stay unchanged. Ordinary installed
 * packages serve the fixture and generated runtime through one directory link.
 *
 * Generated-program selection rejects an empty result before cleanup or public
 * installation. Fixture-only mode retains its independent real CLI boundary.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty generated-program selection precedes cleanup and installation; fixture-only retains its independent real CLI gate. Fresh tarballs and the owner's frozen graph supply published runtimes. Copied fixture inputs and original Swagger, archive, generated-project, invalid-input and simulator assertions retain their sequence.
 * @evidence contracts/common.md#clear-and-simple-design One entry owns public preparation, original fixture generation and the combined generated program. The fixture-only command exits after the same real CLI gate; direct units have their separate runner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Node's ordinary installed export maps and a filesystem directory link supply dependencies. Plain CLI children clear inherited loader/search-path overrides; no package resolver, compiler output, metadata or fixture assertion is substituted.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes copied input from the rebased native config path, identifies installed package ownership and explains diagnostic output retention and the unit boundary.
 * @evidence contracts/portability.md#os-neutral-implementation Native path operations establish the generated root, copied fixture, output parent and tsconfig base. Node junction/symlink support connects the actual dependency directory on Windows and POSIX; executable/argument arrays launch the installed CLI without a shell.
 * @evidence contracts/performance.md#efficient-algorithms One fixture copy and one Swagger generation feed all migration variants. Their combined compiler still checks the original selected source union once; no per-variant native compilation or backend is added.
 * @evidence contracts/performance.md#reuse-equivalent-work The unchanged installed graph serves the real CLI, fixture compiler and generated runtime within this invocation. The fixture's original schemas feed both calling conventions; direct units do not repeat installation or generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous owned CLI children settle before later phases. The entry retains one installation and generated root for diagnosis; the next invocation replaces only its generated root. No listener or worker is created by this entry, and fixture-only stops before variant generation.
 */
export const main = async (preparedConsumer?: {
  root: string;
  requirePublic: NodeRequire;
}): Promise<void> => {
  const scenarios: IScenario[] = selectMigrateScenarios(
    [{ name: "fixture", file: SWAGGER }],
    process.argv.includes("--fixture-only") ? [] : process.argv,
  );
  test_migrate_entry_selection();
  if (fs.existsSync(GENERATED))
    await fs.promises.rm(GENERATED, { recursive: true });
  await fs.promises.mkdir(OUTPUT, { recursive: true });
  await fs.promises.mkdir(path.dirname(SWAGGER), { recursive: true });

  const consumer =
    preparedConsumer ??
    (await require("../../../config/testing/PublicConsumer.ts").preparePublicConsumer(
      "tests/test-migrate",
    ));
  await fs.promises.symlink(
    path.join(consumer.root, "node_modules"),
    path.join(GENERATED, "node_modules"),
    "junction",
  );
  await fs.promises.cp(FIXTURE_SOURCE, FIXTURE, {
    recursive: true,
    filter: (file) => path.basename(file) !== "node_modules",
  });
  const project = JSON.parse(
    await fs.promises.readFile(path.join(FIXTURE, "tsconfig.json"), "utf8"),
  );
  project.extends = path.join(TEST_ROOT, "tsconfig.json");
  await fs.promises.writeFile(
    path.join(FIXTURE, "tsconfig.json"),
    JSON.stringify(project, null, 2),
  );
  const cli = test_migrate_installed_cli_resolution(
    consumer.root,
    consumer.requirePublic,
  );
  await generateSwagger(cli);
  if (process.argv.includes("--fixture-only")) return;

  for (const scenario of scenarios) {
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

if (require.main === module || process.argv[1] === __filename)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
