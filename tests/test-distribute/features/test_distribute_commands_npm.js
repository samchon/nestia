const assert = require("assert/strict");

const { SdkDistributionComposer } = require("../internal/sdk");

/**
 * Verifies the npm command set composed for the distribute installation.
 *
 * Npm projects keep the historical `npm install --save(-dev)` syntax; this pins
 * the base command set (rimraf as devDependency, pinned `@nestia/fetcher` and
 * `typia` as dependencies) with the optional MCP and WebSocket packages omitted
 * when their protocols are unused. It also locks the removal of `npx typia
 * setup`, which typia v13 no longer ships and whose invocation would abort the
 * composer.
 *
 * 1. Compose commands for npm with mcp/websocket disabled.
 * 2. Assert the exact command strings.
 */
exports.test_distribute_commands_npm = () => {
  assert.deepEqual(
    SdkDistributionComposer.commands({
      manager: "npm",
      dependencies: {
        version: "12.0.0-rc.3",
        typia: "^13.0.0",
        tgrid: undefined,
        mcp: "^1.0.0",
      },
      mcp: false,
      websocket: false,
    }),
    [
      "npm install --save-dev rimraf",
      "npm install --save @nestia/fetcher@12.0.0-rc.3",
      "npm install --save typia@^13.0.0",
    ],
  );
};
