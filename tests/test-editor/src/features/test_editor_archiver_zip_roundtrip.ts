import { strFromU8, unzipSync } from "fflate";

import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies NestiaEditorArchiver packs project files into a zip whose entries
 * unzip back byte-identically.
 *
 * The editor's only delivery channel is now the zip download (StackBlitz cannot
 * execute the Go-backed ttsc compiler), so a corrupted or lossy archive would
 * leave users with no way to consume a composed project. This locks path
 * nesting, non-ASCII content, and the sanitized archive name.
 *
 * 1. Pack a file map containing nested paths and non-ASCII content.
 * 2. Unzip the produced archive with fflate.
 * 3. Assert every entry round-trips byte-identically and the archive name drops
 *    the npm scope marker.
 *
 * @evidence contracts/testing.md#behavioral-verification Nested and Unicode content round-trip through real zip bytes; empty input and archive-name boundaries retain exact results.
 * @evidence contracts/testing.md#independent-expectations Handwritten file-map bytes and literal sanitized/fallback filenames establish the oracle independently of archiver output.
 * @evidence contracts/testing.md#distinguishing-cases Empty archive, unusable names, valid leading-dot name and scoped name distinguish payload and naming boundaries.
 * @evidence contracts/testing.md#execution-ownership The isolated editor SSR unit entry discovers this direct case and consumes caller-built operations through its ordinary artifact view. Composition/archive operations return in-memory results, not installed or compiled projects.
 */
export const test_editor_archiver_zip_roundtrip = (): void => {
  const archiver = EditorTestHarness.archiver();
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name: "x" }, null, 2),
    "packages/api/src/index.ts": 'export * from "./module";\n',
    "docs/한글.md": "비 ASCII 내용도 그대로 보존되어야 한다.\n",
  };
  const unzipped = unzipSync(archiver.pack(files));

  const keys: string[] = Object.keys(unzipped).sort();
  const expected: string[] = Object.keys(files).sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected))
    throw new Error(`zip entries mismatch: ${JSON.stringify(keys)}`);
  for (const [key, value] of Object.entries(files))
    if (strFromU8(unzipped[key]!) !== value)
      throw new Error(`zip content mismatch at ${key}`);

  if (Object.keys(unzipSync(archiver.pack({}))).length !== 0)
    throw new Error("An empty project must produce an empty ZIP archive.");
  for (const input of ["", ".", "..."])
    if (archiver.name(input) !== "ORGANIZATION-PROJECT.zip")
      throw new Error(`Unusable archive basename was not replaced: ${input}`);
  if (archiver.name(".hidden") !== ".hidden.zip")
    throw new Error("A usable leading-dot name must be preserved.");

  const name: string = archiver.name("@ORGANIZATION/PROJECT");
  if (name !== "ORGANIZATION-PROJECT.zip")
    throw new Error(`unexpected archive name: ${name}`);
};
