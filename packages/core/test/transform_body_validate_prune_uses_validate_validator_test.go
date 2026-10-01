package test

import "testing"

// TestTransformBodyValidatePruneUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validatePrune"` through the misc
// MiscValidatePruneProgrammer while recording `type: "validate"`.
//
// validatePrune is the report-returning excess-property stripper; it is the
// last arm of nestiaCoreGenerateTypedBody's switch and is produced by a distinct
// misc programmer from the throwing assertPrune path. Pinning it keeps every
// prune arm covered.
//
//  1. Transform the body controller with validate "validatePrune".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode validatePrune must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validatePrune option selects the validate runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validatePrune's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyValidatePruneUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validatePrune", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
