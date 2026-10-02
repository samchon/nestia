// Serves every workspace package's requests from its built entries, as the
// published package would: the workspace manifests point `main` and `exports`
// at TypeScript sources, which plain node cannot load, while each
// `publishConfig.exports` names the built files a consumer resolves. The
// harness preloads this into the `nestia` CLI it runs from `packages/cli/bin`,
// so the CLI runs as users run it, without a TypeScript loader. It serves
// `require()` and `import` alike: a controller written as `.mts` is emitted as
// ES modules and imported.
const fs = require("fs");
const Module = require("module");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "../..");
const packages = fs
  .readdirSync(path.join(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(root, "packages", entry.name))
  .filter((directory) => fs.existsSync(path.join(directory, "package.json")))
  .map((directory) => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(directory, "package.json"), "utf8"),
    );
    return {
      directory,
      name: manifest.name,
      exports: manifest.publishConfig?.exports,
    };
  })
  .filter((pkg) => typeof pkg.name === "string" && pkg.exports !== undefined);

// the target an exports entry selects under the given conditions, in the
// entry's own key order as Node reads it
const target = (entry, conditions) => {
  if (typeof entry === "string") return entry;
  if (entry === null || typeof entry !== "object") return undefined;
  for (const [key, value] of Object.entries(entry))
    if (key === "default" || conditions.includes(key)) {
      const selected = target(value, conditions);
      if (selected !== undefined) return selected;
    }
  return undefined;
};

// the built file a workspace package request resolves to, or undefined for a
// request of another package
const resolve = (request, conditions) => {
  for (const pkg of packages) {
    if (request !== pkg.name && request.startsWith(`${pkg.name}/`) === false)
      continue;
    const subpath = `.${request.slice(pkg.name.length)}`;
    const file = target(pkg.exports[subpath], conditions);
    if (file === undefined)
      throw new Error(
        `${request} is not exported by ${pkg.name}'s publishConfig.exports.`,
      );
    return path.join(pkg.directory, file);
  }
  return undefined;
};

if (typeof Module.registerHooks !== "function")
  throw new Error(
    `test-sdk runs the nestia CLI through module.registerHooks(), which Node ${process.version} lacks; use Node 24, the version the workflows run.`,
  );
Module.registerHooks({
  resolve: (specifier, context, nextResolve) => {
    const file = resolve(specifier, context.conditions ?? []);
    return file === undefined
      ? nextResolve(specifier, context)
      : { url: pathToFileURL(file).href, shortCircuit: true };
  },
});
