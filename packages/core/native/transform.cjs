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
  const typia = assertTypiaVersion(context);
  const plugin = {
    name: "@nestia/core",
    source: path.resolve(__dirname, "cmd", "ttsc-nestia"),
    composes: ["typia/lib/transform"],
    // a typia upgrade must evaluate the version check again
    hostInputs: typia,
  };
  const sdk = resolveSdkContributorSource(context);
  if (sdk !== null) plugin.contributors = [{ name: "sdk", source: sdk }];
  return plugin;
}

// The typia transform this host runs is compiled from the typia Go source
// nestia's own `go.mod` pins, never from the typia package the project installs,
// while the code it emits calls that installed package's runtime. A project
// resolving another typia version would run mismatched code with no error until
// a call reaches the difference (#1663), so the build stops and names both
// versions. The version nestia is built for is the typia @nestia/core itself
// resolves, which its exact dependency holds at the Go pin's release.
//
// Returns the typia manifests read, for ttsc to watch.
function assertTypiaVersion(context) {
  const expected = resolveTypiaManifest([__dirname]);
  const actual =
    context && typeof context.projectRoot === "string"
      ? resolveTypiaManifest([context.projectRoot])
      : null;
  if (
    expected !== null &&
    actual !== null &&
    expected.version !== actual.version
  )
    throw new Error(
      [
        `@nestia/core runs the typia ${expected.version} transform, but this project resolves typia ${actual.version} (${actual.file}).`,
        `The generated code would call typia ${actual.version}'s runtime with typia ${expected.version}'s output.`,
        `Install typia@${expected.version}, or a @nestia/core release built for typia ${actual.version}.`,
      ].join(" "),
    );
  return [
    ...new Set(
      [expected, actual]
        .filter((manifest) => manifest !== null)
        .map((manifest) => manifest.file),
    ),
  ];
}

function resolveTypiaManifest(paths) {
  try {
    const file = require.resolve("typia/package.json", { paths });
    const version = JSON.parse(fs.readFileSync(file, "utf8")).version;
    return typeof version === "string" ? { file, version } : null;
  } catch {
    return null;
  }
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
