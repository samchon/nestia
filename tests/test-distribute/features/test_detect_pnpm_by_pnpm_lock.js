const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies pnpm detection through a `pnpm-lock.yaml` marker.
 *
 * Most pnpm projects carry only the lockfile, not a `packageManager` field. If
 * the lockfile branch regressed, those projects would silently fall back to npm
 * and get a rogue package-lock.json next to their pnpm-lock.yaml.
 *
 * 1. Create a temporary directory containing only a pnpm-lock.yaml file.
 * 2. Detect from that directory.
 * 3. Assert the result is "pnpm".
 */
exports.test_detect_pnpm_by_pnpm_lock = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'\n",
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "pnpm");
  });
