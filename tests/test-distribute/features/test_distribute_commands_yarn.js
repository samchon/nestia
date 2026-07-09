const assert = require("assert/strict");

const { SdkDistributionComposer } = require("../internal/sdk");

/**
 * Verifies the yarn command set composed for the distribute installation, and
 * that protocol packages without a known version are omitted.
 *
 * Yarn needs `yarn add` / `yarn add -D` instead of `npm install`. This case
 * also locks the guard for protocols that are used but whose package version
 * could not be resolved from @nestia/sdk's manifest: emitting an unpinned or
 * `undefined`-versioned install would be worse than skipping.
 *
 * 1. Compose commands for yarn with mcp/websocket enabled but both optional
 *    package versions undefined.
 * 2. Assert the exact command strings, without any optional install.
 */
exports.test_distribute_commands_yarn = () => {
  assert.deepEqual(
    SdkDistributionComposer.commands({
      manager: "yarn",
      dependencies: {
        version: "12.0.0-rc.3",
        typia: "^13.0.0",
        tgrid: undefined,
        mcp: undefined,
      },
      mcp: true,
      websocket: true,
    }),
    [
      "yarn add -D rimraf",
      "yarn add @nestia/fetcher@12.0.0-rc.3",
      "yarn add typia@^13.0.0",
    ],
  );
};
