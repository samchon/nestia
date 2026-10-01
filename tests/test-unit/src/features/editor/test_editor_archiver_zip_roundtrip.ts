import { strFromU8, unzipSync } from "fflate";

import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies NestiaEditorArchiver packs project files into a zip whose entries
 * unzip back byte-identically.
 *
 * The editor's only delivery channel is now the zip download (StackBlitz cannot
 * execute the Go-backed ttsc compiler), so a corrupted or lossy archive would
 * leave users with no way to consume a composed project. This locks path
 * nesting, non-ASCII content, prototype-related filenames and the sanitized
 * archive name.
 *
 * 1. Pack own file keys containing nested paths, non-ASCII content and names that
 *    also identify Object prototype members.
 * 2. Unzip the produced archive with fflate.
 * 3. Assert every entry round-trips byte-identically and the archive name drops
 *    the npm scope marker.
 *
 * @evidence contracts/testing.md#behavioral-verification It packs own file keys with nested paths, Korean content and prototype-related names. Fflate's public extraction filter observes the actual ZIP directory before its result dictionary is populated; exact directory membership and decoded content detect a lost __proto__ file and spurious inherited byte-index directories. The archive name retains its independent literal check.
 * @evidence contracts/testing.md#independent-expectations Unzipping is done by `fflate`, a library independent of the packer's own call, and the expected entries and contents are the input literals.
 * @evidence contracts/testing.md#distinguishing-cases Empty and singleton projects, ordinary/nested paths, non-ASCII content, __proto__, constructor, toString and hasOwnProperty are retained with exact content and no additional ZIP entries. The npm scope marker is the name control; fallback belongs to test_editor_archiver_name_fallback.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_archiver_zip_roundtrip = (): void => {
  const archiver = EditorTestHarness.archiver();
  const files: Record<string, string> = Object.fromEntries([
    ["package.json", JSON.stringify({ name: "x" }, null, 2)],
    ["packages/api/src/index.ts", 'export * from "./module";\n'],
    ["docs/한글.md", "비 ASCII 내용도 그대로 보존되어야 한다.\n"],
    ["__proto__", "prototype filename"],
    ["constructor", "constructor filename"],
    ["toString", "toString filename"],
    ["hasOwnProperty", "hasOwnProperty filename"],
  ]);
  for (const project of [{}, { "ordinary.txt": "normal" }, files]) {
    const keys: string[] = [];
    const unzipped = unzipSync(archiver.pack(project), {
      filter: (file) => {
        keys.push(file.name);
        return true;
      },
    });

    keys.sort();
    const expected: string[] = Object.keys(project).sort();
    if (JSON.stringify(keys) !== JSON.stringify(expected))
      throw new Error(`zip entries mismatch: ${JSON.stringify(keys)}`);
    for (const [key, value] of Object.entries(project))
      if (strFromU8(unzipped[key]!) !== value)
        throw new Error(`zip content mismatch at ${key}`);
  }

  const name: string = archiver.name("@ORGANIZATION/PROJECT");
  if (name !== "ORGANIZATION-PROJECT.zip")
    throw new Error(`unexpected archive name: ${name}`);
};
