const assert = require("assert/strict");

const { SdkDistributionComposer } = require("../internal/sdk");

/**
 * Verifies the pnpm command set composed for the distribute installation,
 * including the optional MCP and WebSocket packages.
 *
 * The composer used to force `npm install` into every project, corrupting pnpm
 * monorepos with a rogue package-lock.json. pnpm must get its own `pnpm add` /
 * `pnpm add -D` syntax, and the protocol-conditional packages must appear when
 * their protocol is used and a version is known.
 *
 * 1. Compose commands for pnpm with mcp/websocket enabled and versions for both
 *    optional packages.
 * 2. Assert the exact command strings, including the two optional installs.
 */
exports.test_distribute_commands_pnpm = () => {
  assert.deepEqual(
    SdkDistributionComposer.commands({
      manager: "pnpm",
      dependencies: {
        version: "12.0.0-rc.3",
        typia: "^13.0.0",
        tgrid: "^1.2.1",
        mcp: "^1.0.0",
      },
      mcp: true,
      websocket: true,
    }),
    [
      "pnpm add -D rimraf",
      "pnpm add @nestia/fetcher@12.0.0-rc.3",
      "pnpm add typia@^13.0.0",
      "pnpm add @modelcontextprotocol/sdk@^1.0.0",
      "pnpm add tgrid@^1.2.1",
    ],
  );
};
