package test

import "testing"

// TestTransformBodyAssertEqualsUsesAssertValidator verifies the @TypedBody
// generator routes `validate: "assertEquals"` through AssertProgrammer with
// Equals:true, recording `type: "assert"`.
//
// assertEquals is the throwing counterpart of equals: it both rejects excess
// properties and throws on mismatch. It shares the assert runtime tag with
// plain assert, so only the Equals flag distinguishes them; a regression in the
// assertEquals arm would drop the excess-property rejection.
//
//  1. Transform the body controller with validate "assertEquals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the assert type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode assertEquals must emit the assert discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported assertEquals option selects the assert runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns assertEquals's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyAssertEqualsUsesAssertValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assertEquals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "assert"`)
}
