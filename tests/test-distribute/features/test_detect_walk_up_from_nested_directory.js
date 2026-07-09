const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies the walk-up from a nested directory to an ancestor marker.
 *
 * The distribute directory (e.g. `packages/api`) usually sits levels below the
 * project root that owns the lockfile, and the composer detects from the
 * distribute directory itself. Intermediate package.json files without a
 * `packageManager` field must not stop the walk, or every monorepo sub-package
 * would fall back to npm.
 *
 * 1. Create `<root>/packages/api` where only `<root>` holds a pnpm-workspace.yaml,
 *    and `packages/api` holds a package.json without a `packageManager` field.
 * 2. Detect from `<root>/packages/api`.
 * 3. Assert the result is "pnpm".
 */
exports.test_detect_walk_up_from_nested_directory = () =>
  withTemporaryDirectory(async (directory) => {
    const nested = path.join(directory, "packages", "api");
    await fs.promises.mkdir(nested, { recursive: true });
    await fs.promises.writeFile(
      path.join(directory, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n",
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(nested, "package.json"),
      JSON.stringify({ name: "api" }),
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory: nested }), "pnpm");
  });
