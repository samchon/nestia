const assert = require("assert/strict");
const path = require("path");

const { PackageManagerDetector } = require("../internal/sdk");

/**
 * Verifies the npm fallback when no marker exists anywhere up to the
 * file-system root.
 *
 * The walk-up must terminate at the root instead of looping forever, and a
 * project without any manager marker keeps the historical npm behavior. An
 * injected file-system view guarantees a marker-free world regardless of what
 * actually exists on the machine running the suite.
 *
 * 1. Build a fake file system where no file exists.
 * 2. Detect from a deeply nested directory through that view.
 * 3. Assert the result is "npm".
 */
exports.test_detect_npm_fallback_without_markers = () => {
  const manager = PackageManagerDetector.detect({
    directory: path.join("some", "deeply", "nested", "project"),
    fs: {
      exists: () => false,
      read: () => {
        throw new Error("Nothing should be read from an empty file system.");
      },
    },
  });
  assert.equal(manager, "npm");
};
