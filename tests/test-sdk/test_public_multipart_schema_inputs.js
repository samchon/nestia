const assert = require("node:assert/strict");
const path = require("node:path");

/**
 * Loads the three original compiled Blob/File schema and form-data calls.
 *
 * Unreferenced compile-only input can disappear when controller and consumer
 * programs are consolidated. Ordinary loading of its actual emitted module
 * requires all three calls to have reached the native transform; untransformed
 * typia factory stubs throw instead of returning their generated values.
 *
 * 1. Resolve this input's actual producer emission inside the owned fixture.
 * 2. Execute its unchanged calls through installed imports and release its cache.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual producer emission must load and execute the original typia.reflect.schemas, typia.json.schemas and typia.http.createFormData calls for the authored Blob/File interface. Missing emission rejects resolution and untransformed factory stubs throw.
 * @evidence contracts/testing.md#independent-expectations The original fixture's three valid public factory calls establish the expected successful compilation and loading. This connection does not assert every generated schema property.
 * @evidence contracts/testing.md#distinguishing-cases Blob and File occur together in the authored interface, through reflection schema, JSON schema and form-data factory operations. A missing program input or absent native transform cannot satisfy actual loading; detailed native provenance distinctions remain with Go units and the existing native-identity connection.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP runner calls this matching boundary after its single producer compilation, outside direct units and transport discovery. It starts no additional compiler, installation or host.
 * @evidence contracts/e2e.md#necessary-boundary Public native composition must connect each original typia call to executable JavaScript through the actual installed runtime; retaining source text alone cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution The case consumes the existing producer result and installed graph. Its compile-only input joins the same producer program and requires no separate preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The contained emitted module owns only three stateless factory calls and a local interface. Its require-cache entry is cleared before loading and in finally so another load cannot replace this execution with a prior result.
 * @evidence contracts/e2e.md#preserved-coverage Every original Blob/File schema and form-data expression remains unchanged apart from the local private interface identity. Their actual compilation and module loading now have a discoverable runner owner.
 */
function test_public_multipart_schema_inputs(consumer, fixture) {
  const emitted = path.join(
    fixture,
    "producer/test/compile/MultipartSchemaConnections.js",
  );
  const resolved = consumer.requirePublic.resolve(emitted);
  const relative = path.relative(fixture, resolved);
  assert(
    relative &&
      relative !== ".." &&
      !relative.startsWith(".." + path.sep) &&
      !path.isAbsolute(relative),
    "Compile-only emission must belong to the actual fixture.",
  );
  delete require.cache[resolved];
  try {
    consumer.requirePublic(resolved);
  } finally {
    delete require.cache[resolved];
  }
}

module.exports = { test_public_multipart_schema_inputs };
