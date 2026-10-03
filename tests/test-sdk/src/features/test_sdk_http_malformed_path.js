require("@nestjs/common");
const assert = require("node:assert/strict");
const { PATH_METADATA, METHOD_METADATA } = require("@nestjs/common/constants");
const {
  ReflectHttpOperationAnalyzer,
} = require("../../../../packages/sdk/lib/analyses/ReflectHttpOperationAnalyzer");

/**
 * Verifies malformed controller paths reject the reflected HTTP operation.
 *
 * Recording a project diagnostic while returning the operation lets direct
 * analyzer consumers retain invalid routes. The malformed parameter token must
 * both report its path and produce a null result.
 *
 * 1. Analyze a zero-parameter GET operation with a valid empty response schema.
 * 2. Reject a controller path ending in an unnamed parameter token.
 * 3. Contrast an ordinary path and a function without route metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Malformed reflected paths return null and exactly the original parameter diagnostic; valid paths and undecorated methods retain their original outcomes.
 * @evidence contracts/testing.md#independent-expectations Router syntax and authored empty response metadata establish the literal invalid-path diagnostic independently of the analyzer.
 * @evidence contracts/testing.md#distinguishing-cases Malformed, valid and undecorated operations cover rejection, acceptance and absence without changing response metadata.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching JavaScript file and exported function in the same language-preparation process as TypeScript units. It calls caller-built product operations with authored input, without installation, native compilation, a host or a child process.
 */
function test_sdk_http_malformed_path() {
  class Controller {
    get() {}
    ordinary() {}
  }
  Reflect.defineMetadata(PATH_METADATA, "", Controller.prototype.get);
  Reflect.defineMetadata(METHOD_METADATA, 0, Controller.prototype.get);
  const analyze = (location, name = "get") => {
    const project = { errors: [], warnings: [] };
    const schema = {
      success: true,
      data: { metadata: { size: 0 }, components: {} },
    };
    const result = ReflectHttpOperationAnalyzer.analyze({
      project,
      controller: { class: Controller, file: "fixture.ts", paths: [location] },
      function: Controller.prototype[name],
      name,
      metadata: {
        parameters: [],
        success: {
          type: { name: "void" },
          imports: [],
          primitive: schema,
          resolved: schema,
        },
        exceptions: [],
        description: null,
        jsDocTags: [],
      },
    });
    return { result, errors: project.errors };
  };
  const invalid = analyze("/invalid/:");
  assert.equal(invalid.result, null);
  assert.equal(invalid.errors.length, 1);
  assert.equal(invalid.errors[0].from, "{parameters}");
  assert.deepEqual(invalid.errors[0].contents, ['invalid path ("/invalid/:")']);
  const valid = analyze("/valid");
  assert.ok(valid.result);
  assert.deepEqual(valid.errors, []);
  assert.deepEqual(analyze("/valid", "ordinary"), { result: null, errors: [] });
}
module.exports = { test_sdk_http_malformed_path };
