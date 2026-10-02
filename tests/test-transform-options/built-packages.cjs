// Serves @nestia/* requests from the packages' built lib/ entries: the workspace
// manifests point at TypeScript sources, which plain node cannot load.
const { registerHooks } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("path");
const root = path.resolve(__dirname, "../..");
const map = {
  "@nestia/core": path.join(root, "packages/core/lib/index.js"),
  "@nestia/fetcher": path.join(root, "packages/fetcher/lib/index.js"),
};
// Node's supported synchronous hook covers both require and import consumers.
registerHooks({
  resolve(request, context, nextResolve) {
    const file = map[request] ?? (
      request.startsWith("@nestia/fetcher/lib/")
        ? path.join(root, "packages/fetcher", request.slice("@nestia/fetcher/".length) + ".js")
        : undefined
    );
    return file === undefined
      ? nextResolve(request, context)
      : { url: pathToFileURL(file).href, shortCircuit: true };
  },
});
