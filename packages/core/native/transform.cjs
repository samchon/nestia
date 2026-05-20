const fs = require("node:fs");
const path = require("node:path");

// `@nestia/core` ttsc plugin descriptor.
//
// `source` is the Go command package of the executable transform host
// (`cmd/ttsc-nestia`, package `main`).
//
// `@nestia/sdk` is NOT a standalone ttsc plugin: its Go transform is declared
// here as a `contributor`, discovered by resolving `@nestia/sdk` from the
// project. ttsc statically links a contributor's Go source into this host
// binary. Consequences:
//
//   - A project that depends on `@nestia/core` but not `@nestia/sdk` never
//     links, compiles, or ships any SDK transform code.
//   - When the `@nestia/core` plugin itself is disabled, this descriptor is
//     never evaluated, so the SDK contributor is never linked either.
function createTtscPlugin(context) {
  const plugin = {
    name: "@nestia/core",
    source: path.resolve(__dirname, "cmd", "ttsc-nestia"),
    composes: ["typia/lib/transform"],
  };
  const sdk = resolveSdkContributorSource(context);
  if (sdk !== null) plugin.contributors = [{ name: "sdk", source: sdk }];
  return plugin;
}

function resolveSdkContributorSource(context) {
  const paths = [__dirname];
  if (context && typeof context.projectRoot === "string")
    paths.push(context.projectRoot);
  try {
    const manifest = require.resolve("@nestia/sdk/package.json", { paths });
    const source = path.resolve(path.dirname(manifest), "native", "sdk");
    return fs.existsSync(source) ? source : null;
  } catch {
    return null;
  }
}

module.exports = createTtscPlugin;
module.exports.createTtscPlugin = createTtscPlugin;
