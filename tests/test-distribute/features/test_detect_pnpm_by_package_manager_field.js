const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies pnpm detection through the `packageManager` field of `package.json`.
 *
 * `nestia sdk --distribute` and `nestia dependencies` used to hard-code npm,
 * which corrupted pnpm monorepos with stray package-lock.json files. The
 * `packageManager` field is the most explicit ownership declaration a project
 * can make, so it must be honored even without any lockfile around.
 *
 * 1. Create a temporary directory whose package.json declares `"packageManager":
 *    "pnpm@10.6.4"` and no lockfile.
 * 2. Detect from that directory.
 * 3. Assert the result is "pnpm".
 */
exports.test_detect_pnpm_by_package_manager_field = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ name: "project", packageManager: "pnpm@10.6.4" }),
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "pnpm");
  });
