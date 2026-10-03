package test

import "testing"

// TestTransformBodyValidateCloneUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validateClone"` through typia plain
// PlainValidateCloneProgrammer while recording `type: "validate"`.
//
// validateClone is the report-returning deep-copy variant; it is produced by a
// distinct plain programmer from the throwing assertClone path and from the
// plain validate path. A regression in the switch would emit the wrong cloner.
//
//  1. Transform the body controller with validate "validateClone".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode validateClone must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement; and the body validator must also carry the marker of its own variant (__clone) while omitting the other variants' helpers.
// @evidence contracts/testing.md#independent-expectations The supported validateClone option selects the validate runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validateClone's emitted family; sibling modes distinguish assert, is and validate selection. The shared E2E test_api_body_validator_variants consumer owns compatible public helper clone, equality, prune and malformed-value semantics plus the actual manual body protocol; it does not claim ten global-configured installed programs executed. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the shared test_api_body_validator_variants consumer owns compatible installed-helper execution.
func TestTransformBodyValidateCloneUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validateClone", "assert")
	mustDecorateAll(t, out, `@core\.TypedBody`, "validate")
	mustSpansContain(t, out, `@core\.TypedBody`, "__clone")
	mustSpansOmit(t, out, `@core\.TypedBody`, "__prune")
}
