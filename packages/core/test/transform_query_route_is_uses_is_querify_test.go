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
func TestTransformQueryRouteIsUsesIsQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "is")
	mustContainAll(t, out, "URLSearchParams", `type: "is"`)
}
