const { version } = require("../../../../package.json");
const cp = require("child_process");
const fs = require("fs");

const ROOT = `${__dirname}/../..`;
const ASSETS = `${ROOT}/assets`;
const TYPIA = require("js-yaml").load(
  fs.readFileSync(`${__dirname}/../../../../pnpm-lock.yaml`, "utf8"),
).catalogs.samchon;

const update = (content, options = {}) => {
  const parsed = JSON.parse(content);
  for (const record of [
    parsed.dependencies ?? {},
    parsed.devDependencies ?? {},
  ])
    for (const key of Object.keys(record))
      if (key.startsWith("@nestia/") || key === "nestia")
        record[key] = `^${version}`;
      else if (TYPIA[key]) record[key] = TYPIA[key].specifier;
  migratePackageJson(parsed);
  if (options.sdkAggregate) {
    parsed.devDependencies ??= {};
    parsed.devDependencies["@nestia/core"] = `^${version}`;
  }
  return JSON.stringify(parsed, null, 2);
};

const migratePackageJson = (parsed) => {
  if (parsed.scripts)
    for (const [key, value] of Object.entries(parsed.scripts))
      if (typeof value === "string")
        parsed.scripts[key] = normalizeScript(value);

  if (typeof parsed.scripts?.prepare === "string") {
    const prepare = parsed.scripts.prepare
      .split("&&")
      .map((str) => str.trim())
      .filter((str) => str !== "ts-patch install" && str !== "typia patch")
      .join(" && ");
    if (prepare.length === 0) delete parsed.scripts.prepare;
    else parsed.scripts.prepare = prepare;
  }

  const devDependencies = parsed.devDependencies;
  if (devDependencies) {
    const usesTypeScript = typeof devDependencies.typescript === "string";
    delete devDependencies["ts-patch"];
    delete devDependencies["typescript-transform-paths"];
    if (usesTypeScript) devDependencies.ttsc ??= "^0.9.0";
  }
};

const normalizeScript = (script) =>
  script.replace(/(^|[^A-Za-z0-9_-])tsc(?=$|[^A-Za-z0-9_-])/g, "$1ttsc");

const updateTsConfig = (content, options = {}) => {
  content = content.replace(
    /^\s*\{\s*"transform":\s*"typescript-transform-paths"\s*\},\n/gm,
    "",
  );
  if (options.disableTypia)
    content = content.replace(
      /\{\s*"transform":\s*"typia\/lib\/transform"\s*\}/g,
      `{ "transform": "typia/lib/transform", "enabled": false }`,
    );
  if (options.useNestiaAggregate)
    content = content.replace(
      /\{\s*"transform":\s*"@nestia\/core\/lib\/transform"\s*\}/g,
      `{ "transform": "@nestia/core/native/transform.cjs" }`,
    );
  if (
    options.useNestiaAggregate &&
    content.includes(`"@nestia/core/native/transform.cjs"`) === false
  )
    content = content.replace(
      /\{\s*"transform":\s*"typia\/lib\/transform",\s*"enabled":\s*false\s*\},/g,
      `{ "transform": "typia/lib/transform", "enabled": false },\n      { "transform": "@nestia/core/native/transform.cjs" },`,
    );
  return content;
};

const bundle = async ({ mode, repository, exceptions, transform }) => {
  const root = `${__dirname}/../..`;
  const assets = `${root}/assets`;
  const template = `${assets}/${mode}`;

  const clone = async () => {
    // CLONE REPOSITORY
    if (fs.existsSync(template))
      await fs.promises.rm(template, { recursive: true });
    else
      try {
        await fs.promises.mkdir(ASSETS);
      } catch {}

    cp.execSync(`git clone https://github.com/samchon/${repository} ${mode}`, {
      cwd: ASSETS,
    });

    // REMOVE VULNERABLE FILES
    for (const location of exceptions ?? [])
      await fs.promises.rm(`${template}/${location}`, { recursive: true });
  };

  const iterate = (collection) => async (location) => {
    const directory = await fs.promises.readdir(location);
    for (const file of directory) {
      const absolute = location + "/" + file;
      const stats = await fs.promises.stat(absolute);
      if (stats.isDirectory()) await iterate(collection)(absolute);
      else {
        const content = await fs.promises.readFile(absolute, "utf-8");
        collection[
          (() => {
            const str = absolute.replace(template, "");
            return str[0] === "/" ? str.substring(1) : str;
          })()
        ] = content;
      }
    }
  };

  const archive = async (collection) => {
    const name = `${mode.toUpperCase()}_TEMPLATE`;
    const body = JSON.stringify(collection, null, 2);
    const content = `export const ${name}: Record<string, string> = ${body}`;

    try {
      await fs.promises.mkdir(`${ROOT}/src/bundles`);
    } catch {}
    await fs.promises.writeFile(
      `${ROOT}/src/bundles/${name}.ts`,
      content,
      "utf8",
    );
  };

  const collection = {};
  await clone();
  await iterate(collection)(template);
  if (transform)
    for (const [key, value] of Object.entries(collection))
      collection[key] = await writeTransformedAsset(
        template,
        key,
        transform(key, value),
      );
  await archive(collection);
};

const writeTransformedAsset = async (template, key, value) => {
  await fs.promises.writeFile(`${template}/${key}`, value, "utf8");
  return value;
};

const main = async () => {
  await bundle({
    mode: "nest",
    repository: "nestia-start",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      ".github/workflows/dependabot-automerge.yml",
      "src/api/functional",
      "src/controllers",
      "src/MyModule.ts",
      "src/providers",
      "test/features",
    ],
    transform: (key, value) => {
      if (key.endsWith("package.json")) return update(value);
      if (key.endsWith("tsconfig.json"))
        return updateTsConfig(value, {
          disableTypia: key === "tsconfig.json",
          useNestiaAggregate: key === "tsconfig.json",
        });
      return value;
    },
  });
  await bundle({
    mode: "sdk",
    repository: "nestia-sdk-template",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      ".github/workflows/build.yml",
      ".github/workflows/dependabot-automerge.yml",
      "src/functional",
      "src/structures",
      "test/features",
    ],
    transform: (key, value) => {
      if (key.endsWith("package.json"))
        return update(value, { sdkAggregate: key === "package.json" });
      if (key.endsWith("tsconfig.json"))
        return updateTsConfig(value, {
          disableTypia: true,
          useNestiaAggregate: true,
        });
      return value;
    },
  });
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
