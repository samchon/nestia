import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies the editor's nest-mode composition emits the pnpm monorepo layout of
 * the new nestia-start template.
 *
 * The editor feeds its zip download from @nestia/migrate, whose nest mode moved
 * from the single-package `src/api` layout to the pnpm monorepo (`packages/api`
 * + `packages/backend`). A regression back to legacy keys would hand users a
 * project whose build scripts point at nothing.
 *
 * 1. Compose a nest-mode project from a minimal OpenAPI 3.1 document.
 * 2. Assert monorepo markers exist: pnpm-workspace.yaml and
 *    packages/backend/nestia.config.ts.
 * 3. Assert no legacy `src/api/...` keys remain.
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
