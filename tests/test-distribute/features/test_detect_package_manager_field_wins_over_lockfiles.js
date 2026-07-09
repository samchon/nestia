const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies that an explicit `packageManager` declaration wins over lockfiles
 * found in the same directory.
 *
 * Projects migrating between managers often keep a stale lockfile around for a
 * while. The `packageManager` field is the deliberate declaration, so it must
 * take precedence within a directory level; otherwise a stray pnpm-lock.yaml
 * would hijack a project that pinned yarn.
 *
 * 1. Create a temporary directory holding both a pnpm-lock.yaml and a package.json
 *    declaring `"packageManager": "yarn@4.5.0"`.
 * 2. Detect from that directory.
 * 3. Assert the result is "yarn".
 */
exports.test_detect_package_manager_field_wins_over_lockfiles = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'\n",
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ name: "project", packageManager: "yarn@4.5.0" }),
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "yarn");
  });
