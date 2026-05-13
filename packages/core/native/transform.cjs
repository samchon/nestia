const path = require("node:path");

function createTtscPlugin(context) {
  const transform = context?.plugin?.transform;
  const name =
    typeof transform === "string" && transform.includes("@nestia/sdk")
      ? "@nestia/sdk"
      : "@nestia/core";
  return {
    name,
    source: path.resolve(__dirname, "cmd", "ttsc-nestia"),
    composes: [
      "typia",
      "typia/lib/transform",
      "@nestia/core",
      "@nestia/core/lib/transform",
      "@nestia/core/native/transform.cjs",
      "@nestia/sdk",
      "@nestia/sdk/lib/transform",
    ],
  };
}

module.exports = createTtscPlugin;
module.exports.createTtscPlugin = createTtscPlugin;
