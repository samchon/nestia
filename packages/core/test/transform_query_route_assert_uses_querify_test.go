package test

import "testing"

// TestTransformQueryRouteAssertUsesQuerify verifies a @TypedQuery.Route under
// the default stringify mode emits the assert querify programmer
// (nestiaCoreHttpAssertQuerifyProgrammer), building a URLSearchParams output.
//
// TypedQuery routes do not JSON-stringify: nestiaCoreGenerateTypedQueryRoute
// must emit a URLSearchParams serializer from the querify programmer family
// instead of a typia stringify. A regression in querify selection would emit a
// JSON validator and silently break query-string serialization.
//
//  1. Transform the query feature's QueryController with stringify "assert".
//  2. Read the emitted --out source.
//  3. Assert the emitted source builds a URLSearchParams output.
//
// @evidence contracts/testing.md#behavioral-verification The query fixture transform with assert stringify must emit URLSearchParams conversion rather than leaving the query-response decorator untransformed.
// @evidence contracts/testing.md#independent-expectations TypedQuery route responses serialize a query string, whose generated representation uses URLSearchParams rather than JSON serialization.
// @evidence contracts/testing.md#distinguishing-cases This owns query serialization presence for assert; query is/validate/stringify and null cases pin alternate selection. The discriminator is read from the query route decorator itself, whose sibling validators run in validate mode, so assert cannot be borrowed from another decorator.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryRouteAssertUsesQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "assert")
	mustContainAll(t, out, "URLSearchParams")
	mustDecorateAll(t, out, `@TypedQuery\.Post`, "assert")
}
