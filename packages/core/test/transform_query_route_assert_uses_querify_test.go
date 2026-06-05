package test

import (
	"strings"
	"testing"
)

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
func TestTransformQueryRouteAssertUsesQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "assert")
	if !strings.Contains(out, "URLSearchParams") {
		t.Fatalf("query route did not emit querify output:\n%s", out)
	}
}
