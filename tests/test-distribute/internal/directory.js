const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Runs a closure inside a fresh temporary directory and removes the directory
 * afterwards, even when the closure throws.
 */
exports.withTemporaryDirectory = async (closure) => {
  const directory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "nestia-test-distribute-"),
  );
  try {
    return await closure(directory);
  } finally {
    await fs.promises.rm(directory, { force: true, recursive: true });
  }
};
