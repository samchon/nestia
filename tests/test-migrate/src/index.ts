import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
  NestiaMigrateFileArchiver,
} from "@nestia/migrate";
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

import { test_migrate_additional_properties } from "./features/test_migrate_additional_properties";
import { test_migrate_api_accessor_collision } from "./features/test_migrate_api_accessor_collision";
import { test_migrate_api_response_header_tags } from "./features/test_migrate_api_response_header_tags";
import { test_migrate_cli_boolean_flags } from "./features/test_migrate_cli_boolean_flags";
import { test_migrate_cli_plain_files } from "./features/test_migrate_cli_plain_files";
import { test_migrate_dto_import_type } from "./features/test_migrate_dto_import_type";
import { test_migrate_keyword_optional_body } from "./features/test_migrate_keyword_optional_body";
import { test_migrate_nest_dto_package_import } from "./features/test_migrate_nest_dto_package_import";
import { test_migrate_nest_keyword_config_path } from "./features/test_migrate_nest_keyword_config_path";
import { test_migrate_nest_monorepo_layout } from "./features/test_migrate_nest_monorepo_layout";
import { test_migrate_nest_named_examples } from "./features/test_migrate_nest_named_examples";
import { test_migrate_nest_route_paths } from "./features/test_migrate_nest_route_paths";
import { test_migrate_nest_workspace_catalog_stamp } from "./features/test_migrate_nest_workspace_catalog_stamp";
import { test_migrate_numeric_bounds } from "./features/test_migrate_numeric_bounds";
import { test_migrate_path_segments } from "./features/test_migrate_path_segments";
import { test_migrate_route_reserved } from "./features/test_migrate_route_reserved";
import { test_migrate_sdk_dependency_catalog_stamp } from "./features/test_migrate_sdk_dependency_catalog_stamp";
import {
  EMPTY_PATHS_DOCUMENT,
  test_migrate_sdk_empty_paths,
} from "./features/test_migrate_sdk_empty_paths";
import { test_migrate_sdk_pnpm_template } from "./features/test_migrate_sdk_pnpm_template";
import { test_migrate_simulate_headers } from "./features/test_migrate_simulate_headers";
import { test_migrate_simulate_throws } from "./features/test_migrate_simulate_throws";
import { test_migrate_success_status } from "./features/test_migrate_success_status";
import { test_migrate_tuple_rest } from "./features/test_migrate_tuple_rest";

const TEST_ROOT: string = process.cwd();
const ROOT: string = path.resolve(TEST_ROOT, "../..");
const FIXTURE: string = path.join(TEST_ROOT, "fixture");
const GENERATED: string = path.join(TEST_ROOT, ".generated");
const SWAGGER: string = path.join(GENERATED, "swagger.json");
const OUTPUT: string = path.join(GENERATED, "output");
const NODE: string = process.execPath;
// Launch the ttsc compiler through its JS entrypoint instead of `pnpm ttsc`:
// spawning the `pnpm.cmd` shim without a shell raises EINVAL on Windows
// (Node's CVE-2024-27980 mitigation), while the node launcher runs the same
// pinned ttsc everywhere.
const TTSC_BIN: string = path.join(
  TEST_ROOT,
  "node_modules",
  "ttsc",
  "lib",
  "launcher",
  "ttsc.js",
);
const TTSC_CACHE_DIR: string = path.resolve(
  TEST_ROOT,
  process.env.TTSC_CACHE_DIR ??
    path.join(ROOT, "node_modules", ".cache", "ttsc"),
);

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

const execute = (
  mode: "nest" | "sdk",
  config: INestiaMigrateConfig,
  scenario: IScenario,
  document: SwaggerDocument,
): Promise<number> => {
  const title: string = `${scenario.name}-${mode}-${
    config.keyword ? "keyword" : "positional"
  }`;
  return measure(title)(async () => {
    const directory = path.join(OUTPUT, title);
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
            package: scenario.name,
          })
        : app.sdk({
            ...config,
            package: scenario.name,
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

    const ttsc = (project?: string): void => {
      spawn(directory, [
        NODE,
        TTSC_BIN,
        "--cache-dir",
        TTSC_CACHE_DIR,
        ...(project !== undefined ? ["-p", project] : []),
      ]);
    };
    if (mode === "nest") {
      // The monorepo template's backend consumes the api workspace package
      // by name (`<slug>-api`). The generated archive is compiled without a
      // `pnpm install`, so emulate the workspace link with a junction/symlink
      // that node module resolution can walk into.
      const nodeModules: string = path.join(directory, "node_modules");
      await fs.promises.mkdir(nodeModules, { recursive: true });
      try {
        fs.symlinkSync(
          path.join(directory, "packages", "api"),
          path.join(nodeModules, `${scenario.name}-api`),
          "junction",
        );
      } catch {}
      ttsc(path.join("packages", "api", "tsconfig.json"));
      ttsc(path.join("packages", "backend", "tsconfig.json"));
      ttsc(path.join("packages", "backend", "test", "tsconfig.json"));
    } else {
      ttsc();
      ttsc("test/tsconfig.json");
    }
  });
};

/**
 * Generates the controller fixture's Swagger document, exercises migration
 * assertions, and compiles the generated NestJS and SDK projects in both
 * calling conventions. The generated files remain available for diagnosis.
 *
 * @evidence contracts/common.md#principled-implementation Swagger comes from the maintained controller fixture; the generated projects are archived and compiled before their compiled simulator is called, so schema generation and emitted consumer validity have separate observable failures.
 * @evidence contracts/common.md#clear-and-simple-design One entry owns fixture preparation and scenario sequencing; execute owns archive and compiler invocation, and named feature functions own their individual assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generated API workspace symlinks represent the workspace package boundary without another installation. Compilation removes only the obsolete typescript-transform-paths descriptor already removed by the bundle transformation; no generated validator or assertion is substituted.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual Swagger producer, generation modes, compiler consumers and retained diagnostic artifacts.
 * @evidence contracts/testing.md#behavioral-verification Fixture Swagger must contain the declared schema/media/security richness, each named feature checks its documented output, generated projects must compile, and the compiled SDK must reject invalid simulated headers.
 * @evidence contracts/testing.md#independent-expectations Named feature literals derive from their input documents and language/framework contracts; compilation independently checks generated TypeScript, while fixture cardinality guards ensure the connection has a rich input.
 * @evidence contracts/testing.md#distinguishing-cases Nest and SDK output, keyword and positional parameters, empty-path SDK compilation, required-header simulation failure/success and the registered schema/path/template cases form this entry's population. A preparation failure stops its dependent scenario.
 * @evidence contracts/testing.md#execution-ownership This exported main is the test-migrate source entry invoked by the workspace start script; it owns real Swagger and compiler boundaries and calls the individually documented direct generator and process cases.
 * @evidence contracts/e2e.md#necessary-boundary The native Swagger producer must connect to decorators and migration output must compile as consumer projects; compiled simulator execution checks validator/runtime composition beyond emitted-text assertions.
 * @evidence contracts/e2e.md#shared-execution One fixture Swagger producer feeds all modes. Generated projects reuse installed workspace dependencies and the shared native cache; each distinct mode/parameter configuration still has its own consumer compilation, and that work is not represented as a single consolidated consumer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The entry resets its owned .generated tree once, scenarios use distinct directories, compiler children finish synchronously, and compiled runtime state is used only after successful compilation. Outputs are retained until the next run for diagnosis rather than deleted on completion.
 * @evidence contracts/e2e.md#preserved-coverage Individual feature calls retain their assertions, both output modes and parameter conventions compile, and empty-path and runtime error cases remain connected. The old arbitrary SDK key snapshot was removed because its expected list came from prior generator output; specific generated layout and import assertions remain in their named tests.
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
    test_migrate_api_response_header_tags();
    test_migrate_dto_import_type();
    test_migrate_nest_monorepo_layout();
    test_migrate_nest_named_examples(document);
    test_migrate_nest_route_paths();
    test_migrate_numeric_bounds();
    test_migrate_path_segments();
    test_migrate_route_reserved();
    test_migrate_simulate_headers();
    test_migrate_success_status();
    test_migrate_keyword_optional_body();
    test_migrate_additional_properties();
    test_migrate_tuple_rest();
    test_migrate_cli_boolean_flags();
    test_migrate_cli_plain_files();
    test_migrate_nest_dto_package_import();
    test_migrate_nest_workspace_catalog_stamp();
    test_migrate_nest_keyword_config_path();
    test_migrate_sdk_empty_paths();
    test_migrate_sdk_pnpm_template();
    test_migrate_sdk_dependency_catalog_stamp();
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
    );
    for (const [mode, keyword] of [
      ["nest", true],
      ["nest", false],
      ["sdk", true],
      ["sdk", false],
    ] as const)
      await execute(
        mode,
        {
          keyword,
          simulate: true,
          e2e: true,
        },
        scenario,
        document,
      );
    await test_migrate_simulate_throws(
      path.join(OUTPUT, `${scenario.name}-sdk-positional`),
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
