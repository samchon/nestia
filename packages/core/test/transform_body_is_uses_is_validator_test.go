package test

import "testing"

// TestTransformBodyIsUsesIsValidator verifies the @TypedBody generator emits a
// typia `is` validator (Equals:false) when the core plugin runs with
// `validate: "is"`.
//
// The is branch of nestiaCoreGenerateTypedBody calls IsProgrammer.Write with
// Equals:false and records `type: "is"`. This is the only non-throwing,
// boolean-returning body validator; a regression that routed it through the
// assert family would change the controller's runtime error behavior.
//
//  1. Transform the body controller with validate "is".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the is type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode is must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyIsUsesIsValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "is", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "is"`)
}
