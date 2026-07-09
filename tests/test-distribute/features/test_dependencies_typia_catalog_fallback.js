const assert = require("assert/strict");

const { DependenciesInstaller } = require("../internal/sdk");

/**
 * Verifies the unpinned typia fallback when @nestia/sdk declares a
 * workspace-relative range.
 *
 * Inside this monorepo, @nestia/sdk's manifest declares typia as
 * `catalog:samchon` (rewritten to a real range only at publish time). Emitting
 * `typia@catalog:samchon` toward the public registry would make the install
 * fail, so such ranges must fall back to an unpinned `typia` spec. The pinned
 * companions are unaffected because the SDK's own version is always concrete.
 *
 * 1. Compose the install command with typia declared as `catalog:samchon`.
 * 2. Assert typia is unpinned while both companions stay pinned.
 * 3. Repeat with a `workspace:^` range and an undefined range.
 */
exports.test_dependencies_typia_catalog_fallback = () => {
  for (const typia of ["catalog:samchon", "workspace:^", undefined])
    assert.deepEqual(
      DependenciesInstaller.compose({
        manager: "pnpm",
        version: "12.0.0-rc.3",
        typia,
      }),
      ["pnpm add @nestia/e2e@^12.0.0-rc.3 @nestia/fetcher@^12.0.0-rc.3 typia"],
      `typia range: ${String(typia)}`,
    );
};
