package test

import "testing"

// TestTransformBodyValidatePruneUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validatePrune"` through typia plain
// PlainValidatePruneProgrammer while recording `type: "validate"`.
//
// validatePrune is the report-returning excess-property stripper; it is the
// last arm of nestiaCoreGenerateTypedBody's switch and is produced by a distinct
// plain programmer from the throwing assertPrune path. Pinning it keeps every
// prune arm covered.
//
//  1. Transform the body controller with validate "validatePrune".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode validatePrune must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement; and the body validator must also carry the marker of its own variant (__prune) while omitting the other variants' helpers.
// @evidence contracts/testing.md#independent-expectations The supported validatePrune option selects the validate runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validatePrune's emitted family; sibling modes distinguish assert, is and validate selection. The shared E2E test_core_boundary_validation_http consumer owns compatible public helper clone, equality, prune and malformed-value semantics plus the actual manual body protocol; it does not claim ten global-configured installed programs executed. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the shared test_core_boundary_validation_http consumer owns compatible installed-helper execution.
func TestTransformBodyValidatePruneUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validatePrune", "assert")
	mustDecorateAll(t, out, `@core\.TypedBody`, "validate")
	mustSpansContain(t, out, `@core\.TypedBody`, "__prune")
	mustSpansOmit(t, out, `@core\.TypedBody`, "__clone")
}
