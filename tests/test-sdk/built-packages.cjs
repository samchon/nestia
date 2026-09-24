// Serves every workspace package's requests from its built entries, as the
// published package would: the workspace manifests point `main` and `exports`
// at TypeScript sources, which plain node cannot load, while each
// `publishConfig.exports` names the built file a consumer resolves. The harness
// preloads this into the `nestia` CLI it runs from `packages/cli/bin`, so the
// CLI runs as users run it, without a TypeScript loader.
const fs = require("fs");
const Module = require("module");
const path = require("path");

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

// the CommonJS target of an exports entry: a string, or its "require" or
// "default" condition
const target = (entry) =>
  typeof entry === "string"
    ? entry
    : entry === null || typeof entry !== "object"
      ? undefined
      : (target(entry.require) ?? target(entry.default));

const resolve = (request) => {
  for (const pkg of packages) {
    if (request !== pkg.name && request.startsWith(`${pkg.name}/`) === false)
      continue;
    const subpath = `.${request.slice(pkg.name.length)}`;
    const file = target(pkg.exports[subpath]);
    if (file === undefined)
      throw new Error(
        `${request} is not exported by ${pkg.name}'s publishConfig.exports.`,
      );
    return path.join(pkg.directory, file);
  }
  return undefined;
};

const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve(request) ?? original.call(this, request, ...rest);
};
