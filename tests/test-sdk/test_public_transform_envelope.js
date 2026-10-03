const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies the public transform API retains its incremental input channels.
 *
 * Generated JavaScript cannot expose the graph or consulted declarations. This
 * necessary source-to-source boundary shares the installed package graph and
 * cache; native Go units own graph construction and omission semantics.
 *
 * 1. Transform the original controller, DTO and unrelated source together.
 * 2. Require generated validation, type-only edges and the config chain.
 * 3. Contrast the unrelated source in both incremental channels.
 *
 * @evidence contracts/testing.md#behavioral-verification The installed public transform API must return actual validator TypeScript, a controller-to-DTO graph edge, both configuration ancestors and the consulted DTO dependency. The unrelated source receives neither the DTO edge nor a consulted-dependency entry.
 * @evidence contracts/testing.md#independent-expectations The original handwritten controller imports IEnvelopeArticle as a type and uses it for TypedBody and TypedRoute; unrelated.ts imports no declaration. The authored project extends its base configuration, which must remain a universal incremental input.
 * @evidence contracts/testing.md#distinguishing-cases Generated validator text rules out a passthrough or vacuous graph. Both unrelated negatives distinguish whole-project widening. Both sources must be present in the transformation before their channel assertions are interpreted.
 * @evidence contracts/testing.md#execution-ownership The public HTTP runner calls this matching case once against its installed graph. One actual TtscCompiler.transform request establishes the JavaScript API boundary; Go discovers the independent native project-envelope unit population.
 * @evidence contracts/e2e.md#necessary-boundary The public transformation result must expose native graph and consulted-declaration sections under joinable project-relative keys. Compilation only returns emitted output and cannot establish this separate adapter contract.
 * @evidence contracts/e2e.md#shared-execution One minimal original source program reuses all installed artifacts and the shared compiler cache; no separate workspace installation, package build or compiled consumer is needed.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The containment-checked project owns copied authored inputs and two configurations. The synchronous transform completes before finally removes only this project; shared installed modules and compiler caches remain intact.
 * @evidence contracts/e2e.md#preserved-coverage The original transformed-validator, graph-presence, type-only positive and unrelated negative, ordered project config, extended base config, dependencies-presence, consulted DTO and unrelated omission assertions remain on the unchanged original sources.
 */
function test_public_transform_envelope(consumer, cache) {
  const fixture = path.join(consumer.root, "projects/transform-envelope");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(fixture, { recursive: true, force: true });
  try {
    fs.cpSync(
      path.join(__dirname, "fixtures/transform-envelope"),
      path.join(fixture, "src/envelope"),
      { recursive: true },
    );
    fs.mkdirSync(path.join(fixture, "lib"));
    fs.writeFileSync(
      path.join(fixture, "tsconfig.base.json"),
      JSON.stringify({
        extends: path.resolve(__dirname, "../config/tsconfig.json"),
        compilerOptions: {
          declaration: false,
          noEmit: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
          sourceMap: false,
        },
      }),
    );
    fs.writeFileSync(
      path.join(fixture, "lib/envelope.json"),
      JSON.stringify({
        extends: "../tsconfig.base.json",
        compilerOptions: {
          rootDir: "../src",
          outDir: "./envelope",
          plugins: [
            { transform: "typia/lib/transform", enabled: false },
            {
              transform: "@nestia/core/native/transform.cjs",
              validate: "assert",
            },
          ],
        },
        include: ["../src/envelope"],
      }),
    );
    const { TtscCompiler } = consumer.requirePublic("ttsc");
    const result = new TtscCompiler({
      cacheDir: cache,
      cwd: fixture,
      projectRoot: fixture,
      tsconfig: "lib/envelope.json",
      env: { TTSC_CACHE_DIR: cache, NESTIA_SDK_TRANSFORM: "0" },
    }).transform();
    if (result.type === "exception") throw result.error;
    assert.equal(result.type, "success", JSON.stringify(result.diagnostics));
    const controller = "src/envelope/controller.ts";
    const dto = "src/envelope/dto.ts";
    const unrelated = "src/envelope/unrelated.ts";
    assert(
      result.typescript[controller],
      "Controller transformation is absent.",
    );
    assert(
      result.typescript[controller].includes('expected: "IEnvelopeArticle"'),
      "The controller carries no validator derived from the DTO.",
    );
    assert(result.typescript[unrelated], "Unrelated transformation is absent.");
    assert(result.graph, "The transformation carries no graph.");
    assert((result.graph.edges[controller] ?? []).includes(dto));
    assert(!(result.graph.edges[unrelated] ?? []).includes(dto));
    assert.equal(result.graph.configs[0], "lib/envelope.json");
    assert(result.graph.configs.includes("tsconfig.base.json"));
    assert(result.dependencies, "The transformation carries no dependencies.");
    assert((result.dependencies[controller] ?? []).includes(dto));
    assert.equal(result.dependencies[unrelated], undefined);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

module.exports = { test_public_transform_envelope };
