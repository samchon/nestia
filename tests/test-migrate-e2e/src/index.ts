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

import { test_migrate_cli_boolean_flags } from "./features/test_migrate_cli_boolean_flags";
import { test_migrate_cli_plain_files } from "./features/test_migrate_cli_plain_files";
import { test_migrate_nest_named_examples } from "./features/test_migrate_nest_named_examples";
import { test_migrate_simulate_throws } from "./features/test_migrate_simulate_throws";
import { EMPTY_PATHS_DOCUMENT } from "./fixtures/EMPTY_PATHS_DOCUMENT";

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
  process.env.TTSC_CACHE_DIR ?? path.join(ROOT, "node_modules", ".ttsc"),
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

// The line is written when the task settles, so scenarios that run together
// never interleave a title with another scenario's output.
const measure =
  (title: string) =>
  async (task: () => Promise<void>): Promise<number> => {
    const time: number = Date.now();
    await task();
    console.log(`  - ${title}: ${(Date.now() - time).toLocaleString()} ms`);
    return Date.now() - time;
  };

// Asynchronous so the scenarios of one run can compile side by side; a child
// that exits non-zero rejects with its command line and keeps its own output.
const spawn = (cwd: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(args[0]!, args.slice(1), {
      stdio: "inherit",
      cwd,
      env: {
        ...process.env,
        TTSC_CACHE_DIR,
      },
    });
    child.once("error", reject);
    child.once("close", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${args.join(" ")} failed with ${signal ?? `exit code ${code}`}.`,
            ),
          ),
    );
  });

const generateSwagger = (): Promise<number> =>
  measure("fixture-swagger")(() =>
    spawn(FIXTURE, [
      NODE,
      path.join(ROOT, "packages", "cli", "bin", "index.js"),
      "swagger",
      "--project",
      "tsconfig.json",
    ]),
  );

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

    const ttsc = (project?: string): Promise<void> =>
      spawn(directory, [
        NODE,
        TTSC_BIN,
        "--cache-dir",
        TTSC_CACHE_DIR,
        ...(project !== undefined ? ["-p", project] : []),
      ]);
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
      await ttsc(path.join("packages", "api", "tsconfig.json"));
      await ttsc(path.join("packages", "backend", "tsconfig.json"));
      await ttsc(path.join("packages", "backend", "test", "tsconfig.json"));
    } else {
      await ttsc();
      await ttsc("test/tsconfig.json");
    }
  });
};

const main = async (): Promise<void> => {
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
    test_migrate_nest_named_examples(document);
    test_migrate_cli_boolean_flags();
    test_migrate_cli_plain_files();
    // Every generated project owns its output directory, and each compiles
    // through its own ttsc children, so the five projects run together; a
    // failure keeps its project title and no project hides another's result.
    const generated: [string, Promise<number>][] = [
      [
        "empty-paths-sdk-keyword",
        execute(
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
      ],
      ...(
        [
          ["nest", true],
          ["nest", false],
          ["sdk", true],
          ["sdk", false],
        ] as const
      ).map(([mode, keyword]): [string, Promise<number>] => [
        `${scenario.name}-${mode}-${keyword ? "keyword" : "positional"}`,
        execute(
          mode,
          {
            keyword,
            simulate: true,
            e2e: true,
          },
          scenario,
          document,
        ),
      ]),
    ];
    const settled = await Promise.allSettled(generated.map(([, task]) => task));
    const failures: string[] = [];
    settled.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push(generated[index]![0]);
        console.error(`  - ${generated[index]![0]}: failed`);
        console.error(result.reason);
      }
    });
    if (failures.length !== 0)
      throw new Error(`Failed migrate projects: ${failures.join(", ")}`);
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
