const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const NODE = process.execPath;
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const PROJECT_CONFIG = "tsconfig.project.json";
const CLI_BIN = path.join(ROOT, "packages/cli/bin/index.js");
const TTSC_BIN = packageBin("ttsc", "ttsc");
const TTSX_BIN = packageBin("ttsc", "ttsx");
const BASE_PORT = 37_000;
const WATCH_TIMEOUT = 90_000;

process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS ?? "",
  "--no-experimental-detect-module",
]
  .filter(Boolean)
  .join(" ");
process.env.NODE_PATH = [
  path.join(ROOT, "node_modules"),
  path.join(ROOT, "node_modules", ".pnpm", "node_modules"),
  process.env.NODE_PATH ?? "",
]
  .filter(Boolean)
  .join(path.delimiter);
delete process.env.npm_config_dir;
delete process.env.npm_config_verify_deps_before_run;

const featureDirectory = (name = "") => path.join(__dirname, "features", name);
const TYPESCRIPT_ERROR_FEATURES = new Set([
  "body-error-get",
  "body-error-implicit",
  "headers-error-array",
  "method-error-head-non-void",
  "route-invalid-path-error",
  "security-error-not-found",
  "security-error-not-oauth2",
  "security-error-out-of-scopes",
]);

const run = (file, args, options) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(file, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: options.stdio ?? "ignore",
      shell: options.shell ?? false,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          Object.assign(
            new Error(
              `${[file, ...args].join(" ")} failed with ${
                signal ?? `exit code ${code}`
              }.`,
            ),
            { code, signal },
          ),
        );
    });
  });

function packageBin(name, key) {
  const directory = path.dirname(
    require.resolve(`${name}/package.json`, { paths: [ROOT] }),
  );
  const pack = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  const location = typeof pack.bin === "string" ? pack.bin : pack.bin?.[key];
  if (location === undefined)
    throw new Error(`Unable to find "${key}" binary from ${name}.`);
  return path.join(directory, location);
}

const runNode = (cwd, script, args, stdio = "ignore", env = undefined) =>
  run(NODE, [script, ...args], { cwd, env, stdio });

const runNestia = (cwd, args, stdio = "ignore") =>
  runNode(cwd, CLI_BIN, args, stdio);

const runTsc = (cwd, stdio = "ignore") => runNode(cwd, TTSC_BIN, [], stdio);

const feature = async (name, port) => {
  if (name === "swagger-watch") return runSwaggerWatchFeature();

  const cwd = featureDirectory(name);
  const configFile =
    name === "cli-config" || name === "cli-config-project"
      ? "nestia.configuration.ts"
      : "nestia.config.ts";
  const generate = async (type, mustBeError = false) => {
    const args = [type, ...generationTail(name)];
    if (mustBeError) return runNestia(cwd, args);
    try {
      await runNestia(cwd, args);
    } catch {
      await runNestia(cwd, args, "inherit");
    }
  };

  if (name.includes("error")) {
    try {
      if (TYPESCRIPT_ERROR_FEATURES.has(name)) await runTsc(cwd);
      await generate("all", true);
      if (hasTtsxTestFiles(cwd)) await runTtsxTest(cwd, "ignore", port);
    } catch {
      return;
    }
    throw new Error("compile error must be occurred.");
  }

  await removePaths(cwd, [
    "swagger.json",
    "src/api/functional",
    "src/api/HttpError.ts",
    "src/api/IConnection.ts",
    "src/api/index.ts",
    "src/api/module.ts",
    "src/api/Primitive.ts",
    "src/test/features/api/automated",
  ]);

  if (name.includes("distribute")) return;
  else if (name === "all") {
    const config = fs.readFileSync(path.join(cwd, configFile), "utf8");
    {
      const lines = config.split("\r\n").join("\n").split("\n");
      if (lines.some((l) => l.startsWith(`  output:`))) await generate("sdk");
    }
    for (const kind of ["swagger", "e2e"])
      if (config.includes(`${kind}:`)) await generate(kind);
  } else await generate("all");

  assertGeneratedImportsAreExtensionless(cwd);
  if (name === "cli-project" || name === "cli-config-project") return;
  else if (hasTtsxTestFiles(cwd)) {
    for (let i = 0; i < 3; ++i)
      try {
        await runTtsxTest(cwd, "ignore", port);
        return;
      } catch {}
    await runTtsxTest(cwd, "inherit", port);
  } else {
    try {
      await runTsc(cwd);
    } catch {
      await runTsc(cwd, "inherit");
    }
  }
};

const removePaths = async (cwd, locations) => {
  await Promise.all(
    locations.map((location) =>
      fs.promises.rm(path.join(cwd, location), {
        force: true,
        recursive: true,
      }),
    ),
  );
};

const generationTail = (name) =>
  name === "cli-config-project"
    ? ["--config", "nestia.configuration.ts", "--project", PROJECT_CONFIG]
    : name === "cli-config"
      ? ["--config", "nestia.configuration.ts"]
      : name === "cli-project"
        ? ["--project", PROJECT_CONFIG]
        : [];

const hasTtsxTestFiles = (cwd) => {
  const iterate = (location) => {
    if (!fs.existsSync(location)) return false;
    for (const file of fs.readdirSync(location)) {
      const next = path.join(location, file);
      const stats = fs.statSync(next);
      if (stats.isDirectory() && iterate(next)) return true;
      if (stats.isFile() && file.endsWith(".ts")) return true;
    }
    return false;
  };
  return iterate(path.join(cwd, "src/test/features"));
};

const assertGeneratedImportsAreExtensionless = (cwd) => {
  const root = path.join(cwd, "src/api");
  if (!fs.existsSync(root)) return;

  const failures = [];
  const iterate = (location) => {
    for (const file of fs.readdirSync(location)) {
      const next = path.join(location, file);
      const stats = fs.statSync(next);
      if (stats.isDirectory()) iterate(next);
      else if (stats.isFile() && file.endsWith(".ts")) {
        const content = fs.readFileSync(next, "utf8");
        const matcher =
          /\b(?:from|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from)\s+["']([^"']+\.(?:[cm]?js|jsx|[cm]?ts|tsx))["']/g;
        for (const match of content.matchAll(matcher))
          if (match[1].startsWith(".") || path.isAbsolute(match[1]))
            failures.push(
              `${path.relative(cwd, next)} imports ${JSON.stringify(match[1])}`,
            );
      }
    }
  };
  iterate(root);
  if (failures.length)
    throw new Error(
      [
        "Generated SDK sources must not include source file extensions in import specifiers.",
        ...failures,
      ].join("\n"),
    );
};

const runSwaggerWatchFeature = async () => {
  const cwd = featureDirectory(`.tmp-swagger-watch-${process.pid}`);
  await fs.promises.rm(cwd, { force: true, recursive: true });
  await writeSwaggerWatchFixture(cwd);

  const child = cp.spawn(NODE, [CLI_BIN, "swagger", "--watch"], {
    cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let exit = null;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  child.on("exit", (code, signal) => {
    exit = { code, signal };
  });

  try {
    const swagger = path.join(cwd, "swagger.json");
    await waitUntil(
      "initial swagger watch generation",
      () => swaggerHasPath(swagger, "/health"),
      () => exit,
      () => output,
    );

    const controller = path.join(cwd, "src/controllers/HealthController.ts");
    const original = fs.readFileSync(controller, "utf8");
    const updated = original.replace(
      "  public get(): void {}",
      [
        "  public get(): void {}",
        "",
        '  @core.TypedRoute.Get("watch")',
        "  public watch(): void {}",
      ].join("\n"),
    );
    if (updated === original)
      throw new Error("Unable to update HealthController.ts watch route.");
    fs.writeFileSync(controller, updated, "utf8");

    await waitUntil(
      "swagger watch regeneration",
      () => swaggerHasPath(swagger, "/health/watch"),
      () => exit,
      () => output,
    );
  } finally {
    await stopChild(child);
    await fs.promises.rm(cwd, { force: true, recursive: true });
  }
};

const writeSwaggerWatchFixture = async (cwd) => {
  await fs.promises.mkdir(path.join(cwd, "src/controllers"), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify(
      {
        name: "@nestia/test-sdk-swagger-watch",
        version: "0.0.0",
        private: true,
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../../config/tsconfig.json",
        include: ["src"],
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "nestia.config.ts"),
    [
      'import { INestiaConfig } from "@nestia/sdk";',
      "",
      "export const NESTIA_CONFIG: INestiaConfig = {",
      '  input: ["src/controllers"],',
      "  swagger: {",
      '    output: "swagger.json",',
      "    info: {",
      '      title: "Swagger Watch Test",',
      "    },",
      "  },",
      "};",
      "export default NESTIA_CONFIG;",
      "",
    ].join("\n"),
    "utf8",
  );
  await fs.promises.writeFile(
    path.join(cwd, "src/controllers/HealthController.ts"),
    [
      'import core from "@nestia/core";',
      'import { Controller } from "@nestjs/common";',
      "",
      '@Controller("health")',
      "export class HealthController {",
      "  @core.TypedRoute.Get()",
      "  public get(): void {}",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
};

const swaggerHasPath = (file, accessor) => {
  if (!fs.existsSync(file)) return false;
  const document = JSON.parse(fs.readFileSync(file, "utf8"));
  return document.paths?.[accessor] !== undefined;
};

const waitUntil = async (title, predicate, exit, output) => {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < WATCH_TIMEOUT) {
    const status = exit();
    if (status !== null)
      throw new Error(
        [
          `${title} failed because watch process exited with ${
            status.signal ?? `code ${status.code}`
          }.`,
          output().slice(-4_000),
        ].join("\n"),
      );
    try {
      if (predicate()) return;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(
    [
      `${title} timed out.`,
      lastError instanceof Error ? lastError.message : "",
      output().slice(-4_000),
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const stopChild = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  await Promise.race([
    exited,
    delay(2_000).then(() => {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
    }),
  ]);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTtsxTest = async (cwd, stdio = "ignore", port = BASE_PORT) => {
  const project = ".ttsx.tsconfig.json";
  const projectFile = path.join(cwd, project);
  fs.writeFileSync(
    projectFile,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        exclude: [],
        compilerOptions: {
          noUnusedLocals: false,
          noUnusedParameters: false,
          outDir: ".",
          plugins: runtimePlugins(cwd),
          rootDir: ".",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  try {
    await runNode(
      cwd,
      TTSX_BIN,
      [
        "-P",
        project,
        // Rescue tsgo's `@api`-alias emit (`require("../../../api/index.js")`)
        // back to the `.ts` source under ttsx's CommonJS load path; ttsc only
        // rescues that `.js` -> `.ts` mismatch on its ESM resolve hook.
        "-r",
        path.join(__dirname, "ttsx-cjs-extension-rescue.cjs"),
        "-r",
        "@nestjs/platform-express",
        "src/test/index.ts",
      ],
      stdio,
      {
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? "",
        TEST_SDK_PORT: String(port),
      },
    );
  } finally {
    fs.rmSync(projectFile, { force: true });
  }
};

const runtimePlugins = (cwd) => {
  const core = readProjectPlugins(cwd).find((plugin) =>
    isTransform(plugin, "@nestia/core"),
  );
  return [
    {
      transform: "typia/lib/transform",
      enabled: false,
    },
    normalizePlugin({
      ...(core ?? {}),
      transform: "@nestia/core/native/transform.cjs",
    }),
  ];
};

const readProjectPlugins = (cwd) => {
  const projectFile = path.join(cwd, "tsconfig.json");
  if (!fs.existsSync(projectFile)) return [];
  const parsed = JSON.parse(
    stripTrailingCommas(
      stripJsonComments(fs.readFileSync(projectFile, "utf8")),
    ),
  );
  const plugins = parsed.compilerOptions?.plugins;
  return Array.isArray(plugins)
    ? plugins
        .filter((plugin) => typeof plugin === "object" && plugin !== null)
        .map((plugin) => ({ ...plugin }))
    : [];
};

const stripJsonComments = (input) => {
  let output = "";
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < input.length; ++i) {
    const ch = input[i];
    const next = input[i + 1];
    if (quoted) {
      output += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') {
      quoted = true;
      output += ch;
    } else if (ch === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") ++i;
      output += "\n";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        output += input[i] === "\n" ? "\n" : " ";
        ++i;
      }
      ++i;
    } else output += ch;
  }
  return output;
};

const stripTrailingCommas = (input) =>
  input.replace(/,\s*([}\]])/g, (_, close) => close);

const normalizePlugin = (plugin) => {
  const output = { ...plugin };
  if (output.enabled === false) delete output.enabled;
  return output;
};

const isTransform = (plugin, name) =>
  typeof plugin.transform === "string" && plugin.transform.includes(name);

const argumentValue = (name) => {
  const index = process.argv.findIndex((str) => str === name);
  return index !== -1 && process.argv.length > index + 1
    ? process.argv[index + 1]
    : undefined;
};

const featureFilter = () => {
  const only = argumentValue("--only");
  if (only !== undefined) return (name) => name.includes(only);
  const from = argumentValue("--from");
  if (from !== undefined) return (name) => name >= from;
  return () => true;
};

const concurrency = (count) => {
  const fallback = Math.min(
    8,
    Math.max(1, os.availableParallelism?.() ?? os.cpus().length ?? 1),
  );
  const raw =
    argumentValue("--concurrency") ?? process.env.TEST_SDK_CONCURRENCY;
  const value = raw === undefined ? fallback : Number(raw);
  return Math.min(
    count,
    Math.max(1, Number.isFinite(value) ? Math.floor(value) : fallback),
  );
};

const measure = (title) => async (task) => {
  const time = Date.now();
  const output = await task();
  const elapsed = Date.now() - time;
  console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
  return output;
};

const runFeatures = async (names) => {
  const parallel = concurrency(names.length);
  console.log(`Test Features (concurrency: ${parallel})`);

  const failures = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < names.length) {
      const index = cursor++;
      const name = names[index];
      try {
        await measure(`  - ${name}`)(() => feature(name, BASE_PORT + index));
      } catch (error) {
        failures.push({ name, error });
        console.error(`  - ${name}: failed`);
        console.error(error);
      }
    }
  };

  await Promise.all(Array.from({ length: parallel }, worker));
  if (failures.length !== 0)
    throw new Error(
      `Failed test-sdk features: ${failures.map((f) => f.name).join(", ")}`,
    );
};

const main = async () => {
  if (process.env.TEST_SDK_SKIP_BUILD !== "1")
    await run(
      PNPM,
      [
        "--workspace-concurrency=1",
        "--filter",
        "@nestia/factory",
        "--filter",
        "@nestia/fetcher",
        "--filter",
        "nestia",
        "--filter",
        "@nestia/core",
        "--filter",
        "@nestia/sdk",
        "--filter",
        "@nestia/e2e",
        "-r",
        "run",
        "build",
      ],
      {
        cwd: ROOT,
        env: {
          NODE_OPTIONS: "",
        },
        shell: process.platform === "win32",
      },
    );

  await measure("\nTotal Elapsed Time")(async () => {
    const filter = featureFilter();
    const names = (await fs.promises.readdir(featureDirectory()))
      .sort()
      .filter((name) => !name.startsWith(".tmp-"))
      .filter(filter);
    if (filter("swagger-watch")) names.push("swagger-watch");
    await runFeatures(names);
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
