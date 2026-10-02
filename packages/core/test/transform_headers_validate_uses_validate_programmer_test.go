package test

import "testing"

// TestTransformHeadersValidateUsesValidateProgrammer verifies the @TypedHeaders
// generator selects the HttpValidateHeaders programmer for validate-family
// modes, recording `type: "validate"`.
//
// nestiaCoreGenerateTypedHeaders has three arms keyed on the validate prefix:
// is/equals → is, validate* → validate, else → assert. This drives the
// validate arm, which the assert-mode headers test does not reach, pinning the
// `strings.HasPrefix(category, "validate")` branch.
//
//  1. Transform the headers feature's HeadersController with validate "validate".
//  2. Read the emitted --out source.
//  3. Assert the header validator metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten headers fixture with mode validate must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validate option selects the validate runtime protocol for headers. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validate's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformHeadersValidateUsesValidateProgrammer(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "validate", "assert")
	mustDecorateAll(t, out, `@core\.TypedHeaders`, "validate")
}
