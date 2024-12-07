const cp = require("child_process");
const fs = require("fs");

const { build } = require("../../deploy/build");

const featureDirectory = (name) => `${__dirname}/../features/${name}`;
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
      name === "cli-config" || name === "cli-config-project"
        ? " --config nestia.configuration.ts"
        : name === "cli-config-project" || name === "cli-project"
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
    } catch {
      return;
    }
    throw new Error("compile error must be occured.");
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
  if (fs.existsSync("src/test")) {
    const test = (stdio) => cp.execSync("npx ts-node src/test", { stdio });
    for (let i = 0; i < 3; ++i)
      try {
        test("ignore");
        return;
      } catch {}
    test("inherit");
  } else cp.execSync("npx tsc", { stdio: "ignore" });
};

const main = async () => {
  const measure = (title) => async (task) => {
    const time = Date.now();
    await task();
    const elapsed = Date.now() - time;
    console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
  };

  await measure("\nTotal Elapsed Time")(async () => {
    if (!process.argv.find((str) => str === "--skipBuild")) await build();
    cp.execSync("pnpm install", { stdio: "inherit" });

    console.log("\nTest Features");
    const filter = (() => {
      const only = process.argv.findIndex((str) => str === "--only");
      if (only !== -1 && process.argv.length >= only + 1)
        return (str) => str.includes(process.argv[only + 1]);
      const from = process.argv.findIndex((str) => str === "--from");
      if (from !== -1 && process.argv.length >= from + 1)
        return (str) => str >= process.argv[from + 1];
      return () => true;
    })();
    if (!process.argv.includes("--skipFeatures")) {
      for (const name of await fs.promises.readdir(featureDirectory("")))
        if (filter(name)) await measure()(async () => feature(name));
    }
  });
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
