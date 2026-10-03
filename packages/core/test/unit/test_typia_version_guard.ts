const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const descriptor = require("../../native/transform.cjs");

/**
 * Verifies the native descriptor watches compatible typia manifests and rejects
 * a conflicting project version through ordinary Node package resolution.
 *
 * The decision belongs to the JavaScript descriptor, before any Go host exists.
 * An exports-blocked package ensures the unresolved control cannot accidentally
 * select an ancestor's manifest instead of exercising that branch.
 *
 * 1. Author matching, exports-blocked and conflicting typia package manifests.
 * 2. Call the real descriptor and check exact watched paths or the version error.
 * 3. Release every authored fixture without compiling or installing a product.
 *
 * @evidence contracts/testing.md#behavioral-verification The real core descriptor watches the matching project manifest, omits an exports-blocked manifest after genuine Node resolution failure, and rejects a differing version with both linked and project versions in its error. No native compiler is invoked to reach this decision.
 * @evidence contracts/testing.md#independent-expectations The linked version comes from typia resolved beside the descriptor. Authored literal manifests declare that exact version or a different minor version; package exports explicitly deny package.json in the unresolved control. Expected watched paths are those authored manifest identities.
 * @evidence contracts/testing.md#distinguishing-cases Matching, unresolvable and mismatched project manifests have separate assertions. The unresolved case first requires ERR_PACKAGE_PATH_NOT_EXPORTED, so ancestor resolution cannot turn it into another matching case. The actual public CLI mismatch connection is owned separately by the integration population.
 * @evidence contracts/testing.md#execution-ownership The package test:unit command explicitly discovers this matching file through Node's test runner. The exported case calls the descriptor directly with caller-authored filesystem inputs, without consumer installation, native build, compiler process or application. One assigned temporary root owns and releases all three inputs.
 */
export function test_typia_version_guard(): void {
  const expected = JSON.parse(
    fs.readFileSync(
      require.resolve("typia/package.json", {
        paths: [path.resolve(__dirname, "../../native")],
      }),
      "utf8",
    ),
  ).version;
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
      fs.writeFileSync(file, JSON.stringify({ name: "typia", ...manifest }));
      return { directory, file };
    };
    const matching = project("matching", { version: expected });
    const plugin = descriptor({ projectRoot: matching.directory });
    assert(plugin.hostInputs.includes(matching.file));

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
