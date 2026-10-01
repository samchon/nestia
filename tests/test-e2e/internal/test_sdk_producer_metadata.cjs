const assert = require("node:assert/strict");
const path = require("node:path");

/**
 * Verifies the composed producer publishes the authored body type metadata.
 *
 * Reading metadata on the emitted controller proves the installed SDK
 * contributor ran alongside core's validators before generation begins.
 *
 * 1. Load the combined producer's emitted body controller.
 * 2. Read update operation metadata and require the authored parameter identity.
 * 3. Contrast its body object import with the primitive path parameter.
 *
 * @evidence contracts/testing.md#behavioral-verification Reflection reads actual injected OperationMetadata from emitted JavaScript; the input parameter must retain its named update type and body DTO import while the path id remains a different parameter.
 * @evidence contracts/testing.md#independent-expectations The hand-written controller update signature names IBbsArticleBody.IUpdateBody, imports IBbsArticleBody and places id before input. These literal identities come from that source declaration, not generated output.
 * @evidence contracts/testing.md#distinguishing-cases The named object body and primitive path id are adjacent controls. The request cases additionally prove core valid-body serialization and invalid-body HTTP rejection on the same producer.
 * @evidence contracts/testing.md#execution-ownership The common start entry invokes this exported assertion once immediately after its installed producer compilation; no additional native program or consumer compile is introduced.
 * @evidence contracts/e2e.md#necessary-boundary Installed compiler environment opt-in and linked SDK metadata injection must connect to actual JavaScript reflection; direct EmitTransform units cannot prove composition and module evaluation.
 * @evidence contracts/e2e.md#shared-execution This reads the one shared producer artifact before generation and reuses its actual controller module; it performs no installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The caller provides the current unique sandbox's emitted artifact root, so stale metadata from another run cannot be selected. The common entry owns module/process lifetime and sandbox cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Combined core/SDK build metadata and environment activation survive here and in actual body requests; exact original type spelling is retained by SDK native authored units.
 */
const test_sdk_producer_metadata = (producer) => {
  const { TypedBodyController } = require(path.join(producer, "scenarios/body/controllers/TypedBodyController.js"));
  const metadata = Reflect.getMetadata("nestia/OperationMetadata", TypedBodyController.prototype, "update");
  assert.ok(metadata, "SDK contributor did not publish update metadata.");
  const input = metadata.parameters.find((parameter) => parameter.name === "input");
  const id = metadata.parameters.find((parameter) => parameter.name === "id");
  assert.ok(input, "Update body parameter metadata is absent.");
  assert.ok(id, "Update path parameter metadata is absent.");
  assert.equal(input.index, 1);
  assert.equal(id.index, 0);
  assert.ok(input.type, "The authored named body type is absent.");
  assert.equal(input.type.name, "IBbsArticleBody.IUpdateBody");
  assert.ok(input.imports.some((entry) => entry.elements.includes("IBbsArticleBody")));
  assert.notEqual(id.type?.name, input.type.name);
};

module.exports = { test_sdk_producer_metadata };
