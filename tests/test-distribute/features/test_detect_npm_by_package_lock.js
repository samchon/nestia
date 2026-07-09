const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies npm detection through a `package-lock.json` marker.
 *
 * Package-lock.json must act as a positive stop marker, not merely fall through
 * to the default: the walk-up has to end at the nearest project boundary
 * instead of continuing into ancestors that may belong to another manager.
 *
 * 1. Create a temporary directory containing only a package-lock.json file.
 * 2. Detect from that directory.
 * 3. Assert the result is "npm".
 */
exports.test_detect_npm_by_package_lock = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "package-lock.json"),
      JSON.stringify({ lockfileVersion: 3 }),
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "npm");
  });
