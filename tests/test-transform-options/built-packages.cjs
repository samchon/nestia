// Serves @nestia/* requests from the packages' built lib/ entries: the workspace
// manifests point at TypeScript sources, which plain node cannot load.
const Module = require("module");
const path = require("path");
const root = path.resolve(__dirname, "../..");
const map = {
  "@nestia/core": path.join(root, "packages/core/lib/index.js"),
  "@nestia/fetcher": path.join(root, "packages/fetcher/lib/index.js"),
};
const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (map[request] !== undefined) return map[request];
  if (request.startsWith("@nestia/fetcher/lib/"))
    return path.join(root, "packages/fetcher", request.slice("@nestia/fetcher/".length) + ".js");
  return original.call(this, request, ...rest);
};
