const path = require("node:path");

// This independently selected transform deliberately makes no observation
// promise: its native hook reads a file outside the compiler filesystem.
module.exports = function createTtscPlugin() {
  return {
    name: "nestia-test/unsupported-input",
    source: path.join(__dirname, "native"),
  };
};
