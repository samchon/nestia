package test

import "testing"

// TestTransformQueryRouteIsUsesIsQuerify verifies a @TypedQuery.Route with
// `stringify: "is"` selects the is-querify programmer
// (nestiaCoreHttpIsQuerifyProgrammer), guarding the URLSearchParams build
// behind a boolean type check and recording `type: "is"`.
//
// nestiaCoreGenerateTypedQueryRoute switches on the stringify mode to pick
// between the assert / is / validate / stringify querify programmers. A
// regression in the switch would emit the assert form and change the runtime
// contract for is-mode query routes.
//
//  1. Transform QueryController with stringify "is".
//  2. Read the emitted --out source.
//  3. Assert URLSearchParams is built and the metadata records is.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten query response fixture with mode is must emit the is discriminator and URLSearchParams conversion. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for query response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family and query serialization; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryRouteIsUsesIsQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "is")
	mustContainAll(t, out, "URLSearchParams")
	mustDecorateAll(t, out, `@TypedQuery\.Post`, "is")
}
