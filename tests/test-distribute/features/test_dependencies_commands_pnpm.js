const assert = require("assert/strict");

const { DependenciesInstaller } = require("../internal/sdk");

/**
 * Verifies the pnpm command composed by `nestia dependencies`.
 *
 * Pnpm's install-a-package verb is `add`, not `install`; the old `${manager}
 * install <lib>` template produced `pnpm install <lib>`, which only works by
 * accident of pnpm's npm compatibility. The pnpm path must emit the canonical
 * syntax with the same pinned specs as npm.
 *
 * 1. Compose the install command for pnpm with a known SDK version and typia
 *    range.
 * 2. Assert the exact `pnpm add` command string with pinned specs.
 */
exports.test_dependencies_commands_pnpm = () => {
  assert.deepEqual(
    DependenciesInstaller.compose({
      manager: "pnpm",
      version: "12.0.0-rc.3",
      typia: "^13.0.0",
    }),
    [
      "pnpm add @nestia/e2e@^12.0.0-rc.3 @nestia/fetcher@^12.0.0-rc.3 typia@^13.0.0",
    ],
  );
};
