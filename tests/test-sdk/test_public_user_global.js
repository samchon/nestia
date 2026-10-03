const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { compilePublicProgram } = require("./PublicCompiler");

/**
 * Verifies a user global in a misleading library filename stays structural.
 *
 * DOM declarations conflict with this program's authored global Blob, so this
 * necessary no-DOM connection reuses the installed graph and compiler cache
 * while keeping its distinct library set. The shared DOM consumer owns the
 * native lookalike rejection and real Blob acceptance controls.
 *
 * 1. Compile the original authored user global with ESNext and no ambient types.
 * 2. Execute the unchanged emitted validator through ordinary installed imports.
 * 3. Require its custom member and release only this owned fixture.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual installed compiler emits the original typia.createIs IUserGlobal predicate. Its unchanged JavaScript accepts customField:string and rejects the same object without that required member.
 * @evidence contracts/testing.md#independent-expectations The authored global Blob in lib.custom.d.ts declares a required string field and is not a default library. It therefore requires structural validation rather than native instanceof identity; the literal payloads follow that declaration.
 * @evidence contracts/testing.md#distinguishing-cases Present and absent customField distinguish structural validation from missing-member acceptance or runtime-native classification. The shared DOM predicate independently rejects a structural lookalike and accepts a real Blob; the Go unit owns declaration classification decisions.
 * @evidence contracts/testing.md#execution-ownership The public shared HTTP runner invokes this matching JavaScript case once after installation. One public compiler request and actual emitted validator execution make it a boundary case, separate from direct Go analysis.
 * @evidence contracts/e2e.md#necessary-boundary The installed core host's typia composition must connect source provenance to a callable structural predicate. Source markers alone cannot prove that generated runtime helper connection.
 * @evidence contracts/e2e.md#shared-execution The case shares all eight installed artifacts and the absolute compiler cache. One separate ESNext/no-ambient program is necessary because adding the DOM declaration would change the very provenance under test; the native twin reuses the existing DOM consumer program.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A containment-checked project under the existing private consumer owns authored copies, config and output. Finally removes its own module cache entry and project without changing installed packages, shared compiler cache or global Blob.
 * @evidence contracts/e2e.md#preserved-coverage The original user.ts and lib.custom.d.ts bytes and both original structural true/false assertions remain. The original DOM false/true decisions already execute in test_api_runtime_native_identity, so a second legacy DOM compilation is unnecessary.
 */
async function test_public_user_global(consumer, cache) {
  const fixture = path.join(consumer.root, "projects/user-global");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  const emitted = path.join(fixture, "out/user.js");
  fs.rmSync(fixture, { recursive: true, force: true });
  try {
    fs.cpSync(
      path.join(__dirname, "fixtures/native-provenance"),
      path.join(fixture, "src"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(fixture, "tsconfig.json"),
      JSON.stringify(
        {
          extends: path.resolve(__dirname, "../config/tsconfig.json"),
          compilerOptions: {
            rootDir: "src",
            outDir: "out",
            noEmit: false,
            declaration: false,
            sourceMap: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            lib: ["ESNext"],
            types: [],
            plugins: [
              { transform: "typia/lib/transform", enabled: false },
              { transform: "@nestia/core/native/transform.cjs" },
            ],
          },
          include: ["src/user.ts", "src/lib.custom.d.ts"],
        },
        null,
        2,
      ),
    );
    await compilePublicProgram(
      consumer.requirePublic("ttsc").TtscCompiler,
      fixture,
      "tsconfig.json",
      cache,
      "out",
      { NESTIA_SDK_TRANSFORM: "1" },
    );
    const user = consumer.requirePublic(emitted);
    assert.equal(
      user.check({ blob: { customField: "x" } }),
      true,
      "a user-authored global Blob was not validated structurally",
    );
    assert.equal(
      user.check({ blob: {} }),
      false,
      "a user-authored global Blob accepted a value missing its member",
    );
  } finally {
    delete require.cache[emitted];
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

module.exports = { test_public_user_global };
