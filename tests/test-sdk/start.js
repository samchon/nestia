const cp = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS ?? "",
  "--no-experimental-detect-module",
]
  .filter(Boolean)
  .join(" ");
delete process.env.npm_config_dir;
delete process.env.npm_config_verify_deps_before_run;

const featureDirectory = (name) => `${__dirname}/features/${name}`;
const feature = (name) => {
  // MOVE TO THE DIRECTORY
  process.chdir(featureDirectory(name));
  process.stdout.write(`  - ${name}`);

  // PREPARE ASSETS
  const file =
    name === "cli-config" || name === "cli-config-project"
      ? "nestia.configuration.ts"
      : "nestia.config.ts";
  const generate = (type, mustBeError) => {
    const tail =
      name === "cli-config-project"
        ? " --config nestia.configuration.ts --project tsconfig.nestia.json"
        : name === "cli-config"
          ? " --config nestia.configuration.ts"
          : name === "cli-project"
            ? " --project tsconfig.nestia.json"
            : "";
    if (mustBeError)
      cp.execSync(`npx nestia ${type}${tail}`, { stdio: "ignore" });
    else
      try {
        cp.execSync(`npx nestia ${type}${tail}`, { stdio: "ignore" });
      } catch {
        cp.execSync(`npx nestia ${type}${tail}`, { stdio: "inherit" });
      }
  };

  // ERROR MODE HANDLING
  if (name.includes("error")) {
    try {
      cp.execSync("npx tsc", { stdio: "ignore" });
      generate("all", true);
      if (fs.existsSync("src/test"))
        runTtsxTest("ignore");
    } catch {
      return;
    }
    throw new Error("compile error must be occurred.");
  }

  // GENERATE SWAGGER & OPENAI & SDK & E2E
  for (const file of [
    "swagger.json",
    "src/api/functional",
    "src/api/HttpError.ts",
    "src/api/IConnection.ts",
    "src/api/index.ts",
    "src/api/module.ts",
    "src/api/Primitive.ts",
    "src/test/features/api/automated",
  ])
    cp.execSync(`npx rimraf ${file}`, { stdio: "ignore" });

  if (name.includes("distribute")) return;
  else if (name === "all") {
    const config = fs.readFileSync(`${featureDirectory(name)}/${file}`, "utf8");
    {
      const lines = config.split("\r\n").join("\n").split("\n");
      if (lines.some((l) => l.startsWith(`  output:`))) generate("sdk");
    }
    for (const kind of ["swagger", "e2e"])
      if (config.includes(`${kind}:`)) generate(kind);
  } else generate("all");

  // RUN TEST AUTOMATION PROGRAM
  if (name === "cli-project" || name === "cli-config-project") return;
  else if (fs.existsSync("src/test")) {
    for (let i = 0; i < 3; ++i)
      try {
        runTtsxTest("ignore");
        return;
      } catch {}
    runTtsxTest("inherit");
  } else {
    const test = (stdio) => cp.execSync("npx tsc", { stdio });
    try {
      test("ignore");
    } catch {
      test("inherit");
    }
  }
};

const runTtsxTest = (stdio) => {
  const project = ".ttsx.tsconfig.json";
  fs.writeFileSync(
    project,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          noUnusedLocals: false,
          noUnusedParameters: false,
          plugins: [
            {
              transform: "typia/lib/transform",
              enabled: false,
            },
            {
              transform: "@nestia/sdk/lib/transform",
              enabled: false,
            },
            {
              transform: "@nestia/core/native/transform.cjs",
            },
          ],
          rootDir: "src",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  try {
    cp.execSync(
      `npx ttsx -P ${project} -r @nestjs/platform-express src/test/index.ts`,
      {
        stdio,
      },
    );
  } finally {
    fs.rmSync(project, { force: true });
  }
};

const main = async () => {
  cp.execSync(
    [
      "pnpm",
      "--filter @nestia/factory",
      "--filter @nestia/fetcher",
      "--filter @nestia/core",
      "--filter @nestia/sdk",
      "--filter @nestia/e2e",
      "-r run build",
    ].join(" "),
    {
      cwd: path.join(__dirname, "../.."),
      env: {
        ...process.env,
        NODE_OPTIONS: "",
      },
      stdio: "ignore",
    },
  );

  const measure = (title) => async (task) => {
    const time = Date.now();
    await task();
    const elapsed = Date.now() - time;
    console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
  };

  await measure("\nTotal Elapsed Time")(async () => {
    console.log("Test Features");
    const filter = (() => {
      const only = process.argv.findIndex((str) => str === "--only");
      if (only !== -1 && process.argv.length >= only + 1)
        return (str) => str.includes(process.argv[only + 1]);
      const from = process.argv.findIndex((str) => str === "--from");
      if (from !== -1 && process.argv.length >= from + 1)
        return (str) => str >= process.argv[from + 1];
      return () => true;
    })();
    for (const name of await fs.promises.readdir(featureDirectory("")))
      if (filter(name)) await measure()(async () => feature(name));
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
