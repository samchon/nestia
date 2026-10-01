package test

import "testing"

// TestTransformBodyValidateEqualsUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validateEquals"` through ValidateProgrammer with
// Equals:true, recording `type: "validate"`.
//
// validateEquals returns the detailed validation report (rather than throwing)
// and rejects excess properties. It shares the validate runtime tag; a
// regression that dropped the Equals flag would silently accept extras while
// still emitting a report.
//
//  1. Transform the body controller with validate "validateEquals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode validateEquals must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validateEquals option selects the validate runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validateEquals's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyValidateEqualsUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validateEquals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
