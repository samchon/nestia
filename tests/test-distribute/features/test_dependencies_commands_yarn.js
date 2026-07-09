const assert = require("assert/strict");

const { DependenciesInstaller } = require("../internal/sdk");

/**
 * Verifies the yarn command composed by `nestia dependencies`.
 *
 * The explicit `--manager yarn` override predates the detection logic and must
 * keep producing `yarn add` while gaining the same pinned specs as the other
 * managers.
 *
 * 1. Compose the install command for yarn with a known SDK version and typia
 *    range.
 * 2. Assert the exact `yarn add` command string with pinned specs.
 */
exports.test_dependencies_commands_yarn = () => {
  assert.deepEqual(
    DependenciesInstaller.compose({
      manager: "yarn",
      version: "12.0.0-rc.3",
      typia: "^13.0.0",
    }),
    [
      "yarn add @nestia/e2e@^12.0.0-rc.3 @nestia/fetcher@^12.0.0-rc.3 typia@^13.0.0",
    ],
  );
};
