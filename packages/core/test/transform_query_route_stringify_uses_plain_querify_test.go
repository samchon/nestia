package test

import "testing"

// TestTransformQueryRouteStringifyUsesPlainQuerify verifies a @TypedQuery.Route
// with `stringify: "stringify"` selects the no-validation querify programmer
// (nestiaCoreHttpQuerifyProgrammer), recording `type: "stringify"`.
//
// The stringify branch skips validation and emits the bare querify serializer;
// it is the third arm of nestiaCoreGenerateTypedQueryRoute's switch. A
// regression that routed it through assert would add unintended validation to a
// route that opted out.
//
//  1. Transform QueryController with stringify "stringify".
//  2. Read the emitted --out source.
//  3. Assert URLSearchParams is built and the metadata records stringify.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten query response fixture with mode stringify must emit the stringify discriminator and URLSearchParams conversion. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported stringify option selects the stringify runtime protocol for query response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns stringify's emitted family and query serialization; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryRouteStringifyUsesPlainQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "stringify")
	mustContainAll(t, out, "URLSearchParams", `type: "stringify"`)
}
