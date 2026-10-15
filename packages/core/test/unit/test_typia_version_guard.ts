const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const descriptor = require("../../native/transform.cjs");

/**
 * Verifies the native descriptor fingerprints compatible typia manifests and
 * rejects a conflicting project version through ordinary Node package
 * resolution.
 *
 * The decision belongs to the JavaScript descriptor, before any Go host exists.
 * An exports-blocked package ensures the unresolved control cannot accidentally
 * select an ancestor's manifest instead of exercising that branch. Changing a
 * manifest without changing its version must change the content proof.
 *
 * 1. Author matching, exports-blocked and conflicting typia package manifests.
 * 2. Call the real descriptor and check watched paths, their byte hashes and
 *    physical paths, including a same-version manifest edit.
 * 3. Reject a conflicting project version with the existing guard diagnostic.
 * 4. Release every authored fixture without compiling or installing a product.
 *
 * @evidence contracts/testing.md#behavioral-verification The real core descriptor returns a SHA-256 proof of each resolved manifest's authored bytes and its native realpath, changes the hash after a same-version edit, omits an exports-blocked manifest after genuine Node resolution failure, and rejects a differing version with both versions in its error.
 * @evidence contracts/testing.md#independent-expectations Authored manifest bytes determine the SHA-256 expectation, and native realpath gives the physical identity. The linked version comes from typia resolved beside the descriptor; literal fixtures declare that version or a different minor version, while package exports deny package.json in the unresolved control.
 * @evidence contracts/testing.md#distinguishing-cases Matching, same-version edited, unresolvable and mismatched project manifests have separate assertions. The unresolved case first requires ERR_PACKAGE_PATH_NOT_EXPORTED, so ancestor resolution cannot turn it into another matching case. The public CLI mismatch connection is owned separately by integration.
 * @evidence contracts/testing.md#execution-ownership The package test:unit entry explicitly registers this matching exported case with Node test. The exported case calls the descriptor directly with caller-authored filesystem inputs, without consumer installation, native build, compiler process or application. One assigned temporary root owns and releases all three inputs.
 */
export function test_typia_version_guard(): void {
  const linkedFile = require.resolve("typia/package.json", {
    paths: [path.resolve(__dirname, "../../native")],
  });
  const linkedContents = fs.readFileSync(linkedFile);
  const expected = JSON.parse(linkedContents.toString("utf8")).version;
  const other = `${expected.split(".")[0]}.99.0`;
  const temporary = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporary, "nestia-core-typia-unit-"));
  const relative = path.relative(temporary, root);
  assert(
    relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    "The assigned fixture must belong to the temporary directory.",
  );
  try {
    const project = (
      name: string,
      manifest: { version?: string; exports?: Record<string, string> },
    ) => {
      const directory = path.join(root, name);
      const file = path.join(directory, "node_modules/typia/package.json");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const contents = JSON.stringify({ name: "typia", ...manifest });
      fs.writeFileSync(file, contents);
      return { directory, file, contents };
    };
    const matching = project("matching", { version: expected });
    const plugin = descriptor({ projectRoot: matching.directory });
    assert(plugin.hostInputs.includes(matching.file));
    assert.deepEqual(
      Object.keys(plugin.hostInputHashes).sort(),
      [...plugin.hostInputs].sort(),
    );
    assert.deepEqual(
      Object.keys(plugin.hostInputRealpaths).sort(),
      [...plugin.hostInputs].sort(),
    );
    for (const [file, contents] of [
      [linkedFile, linkedContents],
      [matching.file, matching.contents],
    ]) {
      assert.equal(
        plugin.hostInputHashes[file],
        crypto.createHash("sha256").update(contents).digest("hex"),
      );
      assert.equal(
        plugin.hostInputRealpaths[file],
        fs.realpathSync.native(file),
      );
    }
    fs.writeFileSync(
      matching.file,
      JSON.stringify({ name: "typia", version: expected, changed: true }),
    );
    const changed = descriptor({ projectRoot: matching.directory });
    assert.notEqual(
      changed.hostInputHashes[matching.file],
      plugin.hostInputHashes[matching.file],
    );
    assert.equal(
      changed.hostInputRealpaths[matching.file],
      plugin.hostInputRealpaths[matching.file],
    );

    const missing = project("missing", { exports: {} });
    assert.throws(
      () =>
        require.resolve("typia/package.json", { paths: [missing.directory] }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
    );
    const unresolved = descriptor({ projectRoot: missing.directory });
    assert(
      unresolved.hostInputs.every(
        (file: string) =>
          file !== missing.directory &&
          !file.startsWith(missing.directory + path.sep),
      ),
    );

    const mismatched = project("mismatched", { version: other });
    assert.throws(
      () => descriptor({ projectRoot: mismatched.directory }),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes(`typia ${expected} transform`) &&
        error.message.includes(`typia ${other}`),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
