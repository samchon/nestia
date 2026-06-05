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
func TestTransformQueryRouteStringifyUsesPlainQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "stringify")
	mustContainAll(t, out, "URLSearchParams", `type: "stringify"`)
}
