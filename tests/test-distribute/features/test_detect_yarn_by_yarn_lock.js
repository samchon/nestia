const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies yarn detection through a `yarn.lock` marker.
 *
 * Yarn projects would previously get npm installs forced into them by the
 * distribute composer, producing a package-lock.json that fights the yarn.lock.
 * The yarn branch must stay distinct from both the pnpm markers and the npm
 * fallback.
 *
 * 1. Create a temporary directory containing only a yarn.lock file.
 * 2. Detect from that directory.
 * 3. Assert the result is "yarn".
 */
exports.test_detect_yarn_by_yarn_lock = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "yarn.lock"),
      "# yarn lockfile v1\n",
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "yarn");
  });
