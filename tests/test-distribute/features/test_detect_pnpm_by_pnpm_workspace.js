const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies pnpm detection through a `pnpm-workspace.yaml` marker.
 *
 * A freshly scaffolded pnpm monorepo (like the nestia ecosystem templates) may
 * declare its workspace before any install has produced a lockfile. The
 * workspace manifest alone must therefore be enough to pick pnpm.
 *
 * 1. Create a temporary directory containing only a pnpm-workspace.yaml file.
 * 2. Detect from that directory.
 * 3. Assert the result is "pnpm".
 */
exports.test_detect_pnpm_by_pnpm_workspace = () =>
  withTemporaryDirectory(async (directory) => {
    await fs.promises.writeFile(
      path.join(directory, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n",
      "utf8",
    );
    assert.equal(PackageManagerDetector.detect({ directory }), "pnpm");
  });
