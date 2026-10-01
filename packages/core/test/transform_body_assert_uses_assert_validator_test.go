package test

import "testing"

// TestTransformBodyAssertUsesAssertValidator verifies the @TypedBody generator
// emits a typia `assert` validator object when the core plugin runs with
// `validate: "assert"`.
//
// nestiaCoreGenerateTypedBody switches on the validate mode to pick the typia
// programmer; the assert branch records `type: "assert"`. A regression in the
// switch would fall through to the validate default and change the runtime
// validator shape silently while still compiling.
//
//  1. Transform the body feature's TypedBodyController with validate "assert".
//  2. Drive the assert / assert plugin in-process and read the --out file.
//  3. Assert the emitted validator metadata records the assert type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten body fixture with mode assert must emit the assert discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement; and the plain validator must omit the equals, clone and prune helpers of the variant modes.
// @evidence contracts/testing.md#independent-expectations The supported assert option selects the assert runtime protocol for body. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns assert's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyAssertUsesAssertValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "assert")
	mustDecorateAll(t, out, `@core\.TypedBody`, "assert")
	mustSpansOmit(t, out, `@core\.TypedBody`, "Object.keys", "__clone", "__prune")
}
