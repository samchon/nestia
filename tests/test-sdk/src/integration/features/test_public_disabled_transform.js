const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const vm = require("node:vm");

const { compilePublicProgram } = require("../internal/PublicCompiler.js");

/**
 * Verifies disabled plugin forwarding and actual no-transform request bindings.
 *
 * Both original inputs use the same disabled plugin configuration, so one
 * compilation replaces their two legacy compiler requests. The emitted fallback
 * application runs with ordinary installed imports in a child, which contains
 * its deliberate global missing-transform policy.
 *
 * 1. Compile both original sources together with enabled:false.
 * 2. Record actual emitted route/body calls and require absent validators.
 * 3. Execute the real fallback application and compare all four HTTP results.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual emitted Get and TypedBody calls receive no validator. The unchanged fallback application must return the original header object, repeated query and form keys, and multipart text/file payload with their original statuses.
 * @evidence contracts/testing.md#independent-expectations enabled:false leaves authored zero-argument decorators unchanged. Literal HTTP requests establish header name abc, title hello, tags a/b and note.txt content independently of generated helpers; original statuses follow authored Get/Post routes.
 * @evidence contracts/testing.md#distinguishing-cases Required decorator call counts prevent an empty capture from passing disabled checks. Header object-vs-array, repeated keys and multipart File text distinguish separate fallback binder defects while preserving all original exact response triples.
 * @evidence contracts/testing.md#execution-ownership The shared public runner invokes this matching case once. One installed compiler request emits both inputs, then one ordinary Node child executes the four original real HTTP requests; portable option dispatch is covered separately by Go units.
 * @evidence contracts/e2e.md#necessary-boundary enabled:false is owned by the JavaScript plugin loader, not Go option dispatch. Real Nest requests establish no-transform binder wiring that generated-validator unit tests cannot exercise.
 * @evidence contracts/e2e.md#shared-execution Both compatible inputs compile together using the existing installed artifacts/cache. Their fallback application needs its untransformed decorators and missing-transform policy, so it cannot reuse the transformed producer application without changing the contract under test.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One contained project owns both inputs/config/output. Recording doubles exist only in a local evaluation callback; a settled child confines the fallback application's global policy and process handles. Finally removes only this project, retaining installed packages and cache.
 * @evidence contracts/e2e.md#preserved-coverage Both original disabled assertions and all four original fallback status/body comparisons remain on unchanged original inputs. No foreign resolver preload is used; the child's output comes from actual unchanged emitted JavaScript.
 */
async function test_public_disabled_transform(consumer, cache) {
  const fixture = path.join(consumer.root, "projects/disabled-transform");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(fixture, { recursive: true, force: true });
  try {
    fs.cpSync(
      path.join(__dirname, "../../../fixtures/disabled-transform"),
      path.join(fixture, "src"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(fixture, "tsconfig.json"),
      JSON.stringify({
        extends: path.resolve(__dirname, "../../../../config/tsconfig.json"),
        compilerOptions: {
          rootDir: "src",
          outDir: "out",
          declaration: false,
          noEmit: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
          sourceMap: false,
          plugins: [
            { transform: "typia/lib/transform", enabled: false },
            { transform: "@nestia/core/native/transform.cjs", enabled: false },
          ],
        },
        include: ["src"],
      }),
    );
    await compilePublicProgram(
      consumer.requirePublic("ttsc").TtscCompiler,
      fixture,
      "tsconfig.json",
      cache,
      "out",
    );
    const file = path.join(fixture, "out/disabled.js");
    const captured = { get: [], body: [] };
    const noop = () => () => undefined;
    const core = {
      TypedBody: (...args) => {
        captured.body.push(args);
        return () => undefined;
      },
      TypedRoute: {
        Get: (...args) => {
          captured.get.push(args);
          return () => undefined;
        },
        Post: noop,
      },
    };
    const modules = {
      "@nestia/core": core,
      "@nestjs/common": { Controller: noop },
    };
    const requireFromFile = createRequire(file);
    const local = { exports: {} };
    vm.compileFunction(
      fs.readFileSync(file, "utf8"),
      ["exports", "require", "module", "__filename", "__dirname"],
      { filename: file },
    ).call(
      local.exports,
      local.exports,
      (request) => modules[request] ?? requireFromFile(request),
      local,
      file,
      path.dirname(file),
    );
    assert.equal(captured.get.length, 1);
    assert.equal(captured.body.length, 1);
    assert.equal(
      captured.get[0][0],
      undefined,
      "Disabled Get was transformed.",
    );
    assert.equal(
      captured.body[0][0],
      undefined,
      "Disabled body was transformed.",
    );
    const result = spawnSync(
      process.execPath,
      [path.join(fixture, "out/fallbacks.js")],
      {
        cwd: fixture,
        encoding: "utf8",
        env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
      },
    );
    if (result.error) throw result.error;
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const line = result.stdout
      .split(/\r?\n/)
      .reverse()
      .find((text) => text.startsWith("{"));
    assert(line, "The fallback application printed no result.");
    const output = JSON.parse(line);
    const expected = {
      headers: { status: 200, body: { isArray: false, name: "abc" } },
      query: { status: 200, body: { title: "hello", tags: ["a", "b"] } },
      urlencoded: { status: 201, body: { title: "hello", tags: ["a", "b"] } },
      multipart: {
        status: 201,
        body: {
          title: "hello",
          tags: ["a", "b"],
          file: { name: "note.txt", text: "content" },
        },
      },
    };
    for (const [key, response] of Object.entries(expected)) {
      assert.equal(output[key].status, response.status, `${key}: status`);
      // Preserve the original JSON comparison, including property order.
      assert.equal(
        JSON.stringify(output[key].body),
        JSON.stringify(response.body),
        `${key}: body`,
      );
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

module.exports = { test_public_disabled_transform };
