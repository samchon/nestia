import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies the editor's nest-mode composition emits the pnpm monorepo layout of
 * the new nestia-start template.
 *
 * The editor feeds its zip download from @nestia/migrate, whose nest mode moved
 * from the single-package `src/api` layout to the pnpm monorepo
 * (`packages/api`
 *
 * - `packages/backend`). A regression back to legacy keys would hand users a
 *   project whose build scripts point at nothing.
 *
 * 1. Compose a nest-mode project from a minimal OpenAPI 3.1 document.
 * 2. Assert monorepo markers exist: pnpm-workspace.yaml and
 *    packages/backend/nestia.config.ts.
 * 3. Assert no legacy `src/api/...` keys remain.
 *
 * @evidence contracts/testing.md#behavioral-verification It composes a nest-mode project through the built composer and asserts the monorepo marker files exist and no legacy `src/api` key remains.
 * @evidence contracts/testing.md#independent-expectations The markers `pnpm-workspace.yaml` and `packages/backend/nestia.config.ts` are the layout the template documents; the keys returned by the composer are compared with that layout, not with the composer's own list.
 * @evidence contracts/testing.md#distinguishing-cases The positive markers are paired with the absence of legacy keys, so a composer that adds the new files but keeps the old ones fails.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_composer_nest_monorepo_files =
  async (): Promise<void> => {
    const composer = EditorTestHarness.composer();
    const result = await composer.nest({
      document: EditorTestHarness.document(),
      e2e: false,
      keyword: true,
      simulate: false,
      package: "@editor/test",
    });
    if (result.success !== true)
      throw new Error(
        `nest composition failed: ${JSON.stringify(result.errors)}`,
      );

    const keys: string[] = Object.keys(result.data!.files);
    for (const marker of [
      "pnpm-workspace.yaml",
      "packages/backend/nestia.config.ts",
    ])
      if (keys.includes(marker) === false)
        throw new Error(`missing monorepo marker: ${marker}`);
    if (keys.some((key) => key.startsWith("packages/api/src/")) === false)
      throw new Error("missing packages/api sources");
    const legacy: string[] = keys.filter((key) => key.startsWith("src/api/"));
    if (legacy.length !== 0)
      throw new Error(`legacy layout keys leaked: ${legacy.join(", ")}`);
  };
