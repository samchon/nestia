const path = require("node:path");

function createTtscPlugin(context) {
  const transform = context?.plugin?.transform;
  const name =
    typeof transform === "string" && transform.includes("@nestia/sdk")
      ? "@nestia/sdk"
      : "@nestia/core";
  const peer =
    name === "@nestia/sdk"
      ? ["@nestia/core/lib/transform"]
      : ["@nestia/sdk/lib/transform"];
  return {
    name,
    source: path.resolve(__dirname, "cmd", "ttsc-nestia"),
    composes: ["typia/lib/transform", ...peer],
  };
}

module.exports = createTtscPlugin;
module.exports.createTtscPlugin = createTtscPlugin;
