import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const {
  publicConsumerHasSharedFiles,
} = require("../../../../config/testing/PublicConsumer.ts");

/**
 * Verifies private consumer files are distinguished from shared hardlinks.
 *
 * Equal package bytes can still share mutable physical metadata with another
 * installation. Migration must detect that ownership difference, while normal
 * dependency directory links must not make the walk inspect external trees.
 *
 * 1. Inspect missing, empty and privately copied file trees.
 * 2. Add and remove an external hardlink to a nested file and require migration
 *    only while its physical identity is shared.
 * 3. Skip a nested directory link and reject linked or non-directory roots.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual ownership predicate observes ordinary filesystem entries and changes its migration answer when a hardlink shares a file's physical metadata; equal copied bytes remain private.
 * @evidence contracts/testing.md#independent-expectations Native hardlinks name one physical file, while copyFile creates an independent file. Literal false/true expectations follow those ownership contracts rather than the predicate's traversal.
 * @evidence contracts/testing.md#distinguishing-cases Missing and empty roots, a private nested copy, an external alias, alias removal and restored sharing distinguish current ownership from byte identity or a persistent marker. An external linked directory is skipped, and linked/file roots reject.
 * @evidence contracts/testing.md#execution-ownership The canonical SDK unit entry discovers this matching function and calls the owner directly using a small temporary filesystem fixture. No installation, compiler or product process runs; finally unlinks the directory link before removing its owned root.
 */
export async function test_public_consumer_file_ownership(): Promise<void> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "nestia-file-ownership-"),
  );
  const tree = path.join(root, "tree");
  const external = path.join(root, "external");
  const directoryLink = path.join(tree, "dependency");
  const rootLink = path.join(root, "root-link");
  let linkedDirectory = false;
  let linkedRoot = false;
  try {
    assert.equal(await publicConsumerHasSharedFiles(tree), false);
    await fs.mkdir(path.join(tree, "nested"), { recursive: true });
    await fs.mkdir(external);
    assert.equal(await publicConsumerHasSharedFiles(tree), false);
    const original = path.join(external, "original.txt");
    const copied = path.join(tree, "nested/copy.txt");
    const alias = path.join(external, "alias.txt");
    await fs.writeFile(original, "unchanged package bytes");
    await fs.copyFile(original, copied);
    assert.equal(await publicConsumerHasSharedFiles(tree), false);
    await fs.link(copied, alias);
    assert.equal(
      await publicConsumerHasSharedFiles(tree),
      true,
      "An external hardlink must require migration.",
    );
    await fs.unlink(alias);
    assert.equal(await publicConsumerHasSharedFiles(tree), false);
    await fs.link(original, alias);
    await fs.symlink(external, directoryLink, "junction");
    linkedDirectory = true;
    assert.equal(await publicConsumerHasSharedFiles(tree), false);
    await fs.link(copied, path.join(tree, "nested/second-name.txt"));
    assert.equal(await publicConsumerHasSharedFiles(tree), true);
    await fs.symlink(tree, rootLink, "junction");
    linkedRoot = true;
    await assert.rejects(
      publicConsumerHasSharedFiles(rootLink),
      /real directory/,
    );
    await assert.rejects(
      publicConsumerHasSharedFiles(copied),
      /real directory/,
    );
  } finally {
    if (linkedRoot) await fs.unlink(rootLink);
    if (linkedDirectory) await fs.unlink(directoryLink);
    await fs.rm(root, { recursive: true });
  }
}
