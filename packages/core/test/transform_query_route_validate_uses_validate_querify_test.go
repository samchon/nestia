package test

import "testing"

// TestTransformQueryRouteValidateUsesValidateQuerify verifies a
// @TypedQuery.Route with `stringify: "validate"` selects the validate-querify
// programmer (nestiaCoreHttpValidateQuerifyProgrammer), recording
// `type: "validate"`.
//
// The validate branch threads the validator output through the querify
// stringifier; it is the only query-route branch that calls the validate
// querify programmer. A regression would silently fall back to the assert
// querify and drop the validation report.
//
//  1. Transform QueryController with stringify "validate".
//  2. Read the emitted --out source.
//  3. Assert URLSearchParams is built and the metadata records validate.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten query response fixture with mode validate must emit the validate discriminator and URLSearchParams conversion. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validate option selects the validate runtime protocol for query response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validate's emitted family and query serialization; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. The assertion is scoped to every emitted call of the owning decorator, so another decorator of the same controller carrying the same discriminator cannot satisfy it.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryRouteValidateUsesValidateQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "validate")
	mustContainAll(t, out, "URLSearchParams")
	mustDecorateAll(t, out, `@TypedQuery\.Post`, "validate")
}
