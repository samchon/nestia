const assert = require("assert/strict");

const { DependenciesInstaller } = require("../internal/sdk");

/**
 * Verifies the npm command composed by `nestia dependencies`, with every
 * package pinned.
 *
 * The command used to install `@nestia/e2e`, `@nestia/fetcher`, and `typia`
 * unpinned, so the registry's latest could introduce an incompatible major next
 * to an older SDK. The companions must be pinned to the running SDK's own
 * version line and typia to the range @nestia/sdk declares.
 *
 * 1. Compose the install command for npm with a known SDK version and typia range.
 * 2. Assert the exact command string with all three pinned specs.
 */
exports.test_dependencies_commands_npm = () => {
  assert.deepEqual(
    DependenciesInstaller.compose({
      manager: "npm",
      version: "12.0.0-rc.3",
      typia: "^13.0.0",
    }),
    [
      "npm install @nestia/e2e@^12.0.0-rc.3 @nestia/fetcher@^12.0.0-rc.3 typia@^13.0.0",
    ],
  );
};
