import { strFromU8, unzipSync } from "fflate";

import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies an sdk-mode composition survives the full download pipeline:
 * compose, pack, unzip.
 *
 * This is the exact path a user triggers in the editor UI (compose through
 * @nestia/migrate, then archive through NestiaEditorArchiver), so it locks the
 * integration between the two internals rather than either in isolation. The
 * package name the user typed must also reach the downloaded manifest.
 *
 * 1. Compose an sdk-mode project from a minimal OpenAPI 3.1 document and a package
 *    name.
 * 2. Pack the composed files and unzip the archive.
 * 3. Assert the archive holds exactly the composed files with their content, and
 *    that the manifest and the swagger document are among them.
 * 4. Assert the manifest is named after the given package.
 *
 * @evidence contracts/testing.md#behavioral-verification It composes an sdk-mode project, packs it, unzips it with fflate and asserts the set of entries and every entry's content equal the composed files, so a file lost, added or altered by packing is detected, and that the manifest's name follows the given package.
 * @evidence contracts/testing.md#independent-expectations The unzip is done by `fflate`, independent of the packing code, and the expectation is the composed file map itself; the manifest name is the given package with the `-api` suffix the SDK template defines for its library package.
 * @evidence contracts/testing.md#distinguishing-cases The manifest and the swagger document are named as mandatory entries beside the whole-map comparison, and the package name is a second input whose effect is read from the manifest; nest-mode layout is owned by `test_migrate_nest_monorepo_layout` and skipped operations by `test_editor_composer_skipped_operations`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-editor` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_composer_sdk_zip_entries = async (): Promise<void> => {
  const composer = EditorTestHarness.composer();
  const archiver = EditorTestHarness.archiver();
  const result = await composer.sdk({
    document: EditorTestHarness.document(),
    e2e: false,
    keyword: true,
    simulate: false,
    package: "@editor/test",
  });
  if (result.success !== true)
    throw new Error(`sdk composition failed: ${JSON.stringify(result.errors)}`);

  const files: Record<string, string> = result.data!.files;
  const unzipped = unzipSync(archiver.pack(files));
  if (
    JSON.stringify(Object.keys(unzipped).sort()) !==
    JSON.stringify(Object.keys(files).sort())
  )
    throw new Error(
      `the archive entries differ from the composed files: ${JSON.stringify(Object.keys(unzipped).sort())}`,
    );
  for (const [key, value] of Object.entries(files))
    if (strFromU8(unzipped[key]!) !== value)
      throw new Error(`the archive changed the content of ${key}`);
  for (const marker of ["package.json", "swagger.json"])
    if (files[marker] === undefined || files[marker].length === 0)
      throw new Error(`the composed project is missing ${marker}`);

  const name: unknown = JSON.parse(files["package.json"]!).name;
  if (name !== "@editor/test-api")
    throw new Error(`the manifest is named ${String(name)}.`);
};
