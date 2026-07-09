const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const { withTemporaryDirectory } = require("../internal/directory");
const { BUNDLE, SdkDistributionComposer } = require("../internal/sdk");

/**
 * Verifies the write-if-missing contract of the distribute bundle copy.
 *
 * The composer used to `copyFile` every bundled file unconditionally on first
 * setup, so a user-authored README.md or tsconfig.json in the distribute
 * directory was silently clobbered. Each file must now be copied only when
 * missing, and the returned list must name exactly the files created — the
 * composer relies on it to patch path placeholders only in files it created
 * itself.
 *
 * 1. Pre-place a README.md with sentinel content in a temporary directory.
 * 2. Copy the real distribute bundle assets into it.
 * 3. Assert the README.md content is untouched, the remaining bundle files were
 *    created, and the returned list excludes README.md.
 */
exports.test_distribute_bundle_copy_preserves_existing_files = () =>
  withTemporaryDirectory(async (directory) => {
    const sentinel = "# user authored readme\n";
    await fs.promises.writeFile(
      path.join(directory, "README.md"),
      sentinel,
      "utf8",
    );

    const copied = await SdkDistributionComposer.copyBundle({
      from: BUNDLE,
      into: directory,
    });

    const bundled = (await fs.promises.readdir(BUNDLE)).sort();
    assert.deepEqual(
      copied.sort(),
      bundled.filter((file) => file !== "README.md"),
    );
    assert.equal(
      await fs.promises.readFile(path.join(directory, "README.md"), "utf8"),
      sentinel,
    );
    for (const file of bundled)
      assert.equal(
        fs.existsSync(path.join(directory, file)),
        true,
        `${file} must exist after the copy.`,
      );
  });
