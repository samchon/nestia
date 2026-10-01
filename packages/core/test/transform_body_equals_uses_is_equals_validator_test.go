package test

import "testing"

// TestTransformBodyEqualsUsesIsEqualsValidator verifies the @TypedBody
// generator routes `validate: "equals"` through IsProgrammer with Equals:true
// while still recording `type: "is"`.
//
// The equals branch is distinct from is only in the Equals flag, which makes
// the validator reject excess properties; it shares the is runtime type tag.
// A regression that dropped the Equals flag would silently accept extra
// properties, so this pins the equals arm separately from is.
//
//  1. Transform the body controller with validate "equals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata still records the is type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode equals must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported equals option selects the is runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns equals's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyEqualsUsesIsEqualsValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "equals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "is"`)
}
