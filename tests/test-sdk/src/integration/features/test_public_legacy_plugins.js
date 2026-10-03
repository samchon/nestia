const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const vm = require("node:vm");

/**
 * Verifies the public legacy plugin list preserves request/response options and
 * injects SDK operation metadata exactly once into the shared producer.
 *
 * The three documented v11 entries must compose into the same native host.
 * Evaluating actual emitted decorator calls distinguishes their arguments and
 * invocation counts without building a separate option fixture or server.
 *
 * 1. Read the shared producer's emitted eight-route variable controller.
 * 2. Evaluate its decorator calls with local recording doubles and real helpers.
 * 3. Require assert protocols and one metadata call for every authored route.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual public compilation with typia/lib/transform, core/lib/transform and sdk/lib/transform must inject assert body and Post serializer arguments and exactly eight SDK metadata calls. Missing options, duplicate contributor application and absent transformation fail independently.
 * @evidence contracts/testing.md#independent-expectations The authored variable controller has eight route methods, three body parameters and one Post route. Explicit legacy options request assert validation and serialization. These literal expectations come from the authored input and public option contract, not from generated metadata counts.
 * @evidence contracts/testing.md#distinguishing-cases Each of three body arguments must select assert; the Post response separately selects assert. Eight metadata invocations distinguish a missing or duplicate SDK pass even when reflection would overwrite repeated metadata with the same value. The shared real HTTP population executes this same compiled controller with valid and malformed requests.
 * @evidence contracts/testing.md#execution-ownership The shared public runner calls this matching exported case after its producer compilation. Its input is actual installed-compiler output; it launches no additional compiler, application or worker. The owning Go option and SDK units retain their in-process semantic controls.
 * @evidence contracts/e2e.md#necessary-boundary Ordinary installed plugin discovery and legacy descriptor deduplication must preserve options and one SDK contribution. Native operation units cannot establish that JavaScript loader composition; real emitted calls and the shared actual HTTP runtime supply that connection.
 * @evidence contracts/e2e.md#shared-execution The case reuses the producer already needed by 105 HTTP cases and generation. It reads one emitted controller and evaluates it once, adding no installation, compiler program or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Recording doubles belong only to this module evaluation and its supplied require callback; they change no process loader or foreign exports. Other dependencies resolve normally beside the installed emitted file. No controller handler executes during recording.
 * @evidence contracts/e2e.md#preserved-coverage The old v11 fixture's body assert, Post serializer assert and exact metadata-per-route assertions remain on actual public emitted output. The shared input expands the once-per-route distinction from two authored routes to eight and the request distinction to three body sites.
 */
function test_public_legacy_plugins(fixture) {
  const file = path.join(
    fixture,
    "producer/controllers/variable/BbsPackageArticlesController.js",
  );
  const captured = { bodies: [], posts: [], metadata: [], sites: [] };
  const noop = () => () => undefined;
  const core = {
    TypedParam: noop,
    TypedQuery: noop,
    TypedBody: (...args) => {
      captured.bodies.push(args);
      return () => undefined;
    },
    TypedRoute: {
      Get: noop,
      Patch: noop,
      Put: noop,
      Delete: noop,
      Post: (...args) => {
        captured.posts.push(args);
        return () => undefined;
      },
    },
  };
  const modules = {
    "@nestia/core": { __esModule: true, default: core, ...core },
    "@nestjs/common": { Controller: noop },
    "@nestia/sdk": {
      OperationMetadata: (...args) => {
        captured.metadata.push(args);
        return (_target, property) => {
          captured.sites.push(property);
        };
      },
    },
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
  assert.equal(captured.bodies.length, 3);
  for (const body of captured.bodies) assert.equal(body[0]?.type, "assert");
  assert.equal(captured.posts.length, 1);
  assert.equal(captured.posts[0][0]?.type, "assert");
  assert.equal(captured.metadata.length, 8);
  assert.deepEqual(captured.sites.sort(), [
    "$delete",
    "at",
    "catch",
    "delete",
    "index",
    "new",
    "store",
    "update",
  ]);
}

module.exports = { test_public_legacy_plugins };
