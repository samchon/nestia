import api from "@api";

/**
 * Verifies source-file SDK generation includes `.mts` and `.cts` controller
 * modules.
 *
 * The source-input generator compiles controllers to a temporary runtime
 * directory before reading reflected route metadata. TypeScript emits `.mts` as
 * `.mjs` and `.cts` as `.cjs`; the loader must follow those emitted names
 * instead of assuming every source becomes `.js`.
 *
 * 1. Generate the SDK from controllers stored in `.mts` and `.cts` files.
 * 2. Touch both generated SDK accessors and assert each path is preserved.
 * 3. Call both routes through the generated SDK to prove the dynamic runtime
 *    module loader imports them too.
 */
export const test_source_extension = async (
  connection: api.IConnection,
): Promise<void> => {
  api.functional.source_extension.cts.METADATA;
  api.functional.source_extension.mts.METADATA;

  if (api.functional.source_extension.cts.path() !== "/source-extension/cts")
    throw new Error("Generated SDK must include the .cts controller route.");
  if (api.functional.source_extension.mts.path() !== "/source-extension/mts")
    throw new Error("Generated SDK must include the .mts controller route.");

  await api.functional.source_extension.cts(connection);
  await api.functional.source_extension.mts(connection);
};
