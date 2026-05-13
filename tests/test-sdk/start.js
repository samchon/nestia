const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const TTSC_CACHE_DIR = path.resolve(
  ROOT,
  process.env.TTSC_CACHE_DIR ?? path.join(ROOT, "node_modules", ".ttsc"),
);
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const PROJECT_CONFIG = "tsconfig.project.json";

process.env.TTSC_CACHE_DIR = TTSC_CACHE_DIR;
process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS ?? "",
  "--no-experimental-detect-module",
]
  .filter(Boolean)
  .join(" ");
delete process.env.npm_config_dir;
delete process.env.npm_config_verify_deps_before_run;

const featureDirectory = (name = "") => path.join(__dirname, "features", name);

const run = (file, args, options) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(file, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: options.stdio ?? "ignore",
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

const runNpx = (cwd, args, stdio = "ignore", env = undefined) =>
  run(NPX, args, { cwd, env, stdio });

const feature = async (name) => {
  const cwd = featureDirectory(name);
  const configFile =
    name === "cli-config" || name === "cli-config-project"
      ? "nestia.configuration.ts"
      : "nestia.config.ts";
  const generate = async (type, mustBeError = false) => {
    const args = ["nestia", type, ...generationTail(name)];
    if (mustBeError) return runNpx(cwd, args);
    try {
      await runNpx(cwd, args);
    } catch {
      await runNpx(cwd, args, "inherit");
    }
  };

  if (name.includes("error")) {
    try {
      await runNpx(cwd, ["tsc"]);
      await generate("all", true);
      if (hasTtsxTestFiles(cwd)) await runTtsxTest(cwd);
    } catch {
      return;
    }
    throw new Error("compile error must be occurred.");
  }

  await runNpx(cwd, [
    "rimraf",
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

  if (name === "cli-project" || name === "cli-config-project") return;
  else if (hasTtsxTestFiles(cwd)) {
    for (let i = 0; i < 3; ++i)
      try {
        await runTtsxTest(cwd);
        return;
      } catch {}
    await runTtsxTest(cwd, "inherit");
  } else {
    try {
      await runNpx(cwd, ["tsc"]);
    } catch {
      await runNpx(cwd, ["tsc"], "inherit");
    }
  }
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

const runTtsxTest = async (cwd, stdio = "ignore") => {
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
          plugins: [
            {
              transform: "typia/lib/transform",
              enabled: false,
            },
            {
              transform: "@nestia/sdk/lib/transform",
            },
            {
              transform: "@nestia/core/native/transform.cjs",
            },
          ],
          rootDir: ".",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  try {
    const nodeOptions = [
      process.env.NODE_OPTIONS ?? "",
      `--loader=${path.join(__dirname, "config-ts-loader.mjs")}`,
    ]
      .filter(Boolean)
      .join(" ");
    await runNpx(
      cwd,
      [
        "ttsx",
        "--cache-dir",
        TTSC_CACHE_DIR,
        "-P",
        project,
        "-r",
        "@nestjs/platform-express",
        "src/test/index.ts",
      ],
      stdio,
      {
        NODE_OPTIONS: nodeOptions,
      },
    );
  } finally {
    fs.rmSync(projectFile, { force: true });
  }
};

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
    4,
    Math.max(1, os.availableParallelism?.() ?? os.cpus().length ?? 1),
  );
  const raw = argumentValue("--concurrency") ?? process.env.TEST_SDK_CONCURRENCY;
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
        await measure(`  - ${name}`)(() => feature(name));
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
  await run(
    PNPM,
    [
      "--workspace-concurrency=1",
      "--filter",
      "@nestia/factory",
      "--filter",
      "@nestia/fetcher",
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
    },
  );

  await measure("\nTotal Elapsed Time")(async () => {
    const filter = featureFilter();
    const names = (await fs.promises.readdir(featureDirectory()))
      .sort()
      .filter(filter);
    await runFeatures(names);
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
