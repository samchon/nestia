const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies that a nested npm project stops the walk before an ancestor pnpm
 * workspace is reached.
 *
 * A standalone npm project checked out inside a larger pnpm monorepo (a
 * vendored app, a test fixture, ...) owns its own package-lock.json. Installs
 * must stay inside that boundary; walking past it to the outer pnpm markers
 * would run pnpm against a project npm manages and mutate the outer workspace's
 * lockfile.
 *
 * 1. Create `<root>` with a pnpm-workspace.yaml and pnpm-lock.yaml, plus a nested
 *    `<root>/vendor/app` holding package.json + package-lock.json.
 * 2. Detect from `<root>/vendor/app`.
 * 3. Assert the result is "npm".
 */
exports.test_detect_nested_package_lock_wins_over_ancestor_pnpm = () =>
  withTemporaryDirectory(async (directory) => {
    const nested = path.join(directory, "vendor", "app");
    await fs.promises.mkdir(nested, { recursive: true });
    await fs.promises.writeFile(
      path.join(directory, "pnpm-workspace.yaml"),
      "packages:\n  - 'vendor/*'\n",
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(directory, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'\n",
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(nested, "package.json"),
      JSON.stringify({ name: "app" }),
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(nested, "package-lock.json"),
      JSON.stringify({ lockfileVersion: 3 }),
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory: nested }), "npm");
  });
