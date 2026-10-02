import { unzipSync } from "fflate";

import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies an sdk-mode composition survives the full download pipeline:
 * compose, pack, unzip.
 *
 * This is the exact path a user triggers in the editor UI (compose through
 * @nestia/migrate, then archive through NestiaEditorArchiver), so it locks the
 * integration between the two internals rather than either in isolation.
 *
 * 1. Compose an sdk-mode project from a minimal OpenAPI 3.1 document.
 * 2. Pack the composed files and unzip the archive.
 * 3. Assert the project manifest and swagger document survive with content.
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

  const unzipped = unzipSync(archiver.pack(result.data!.files));
  for (const marker of ["package.json", "swagger.json"]) {
    const entry = unzipped[marker];
    if (entry === undefined || entry.length === 0)
      throw new Error(`zip is missing ${marker}`);
  }
};
