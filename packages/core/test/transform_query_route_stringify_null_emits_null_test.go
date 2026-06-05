package test

import (
	"strings"
	"testing"
)

// TestTransformQueryRouteStringifyNullEmitsNull verifies that `stringify: null`
// also disables querification on a @TypedQuery route: the appended response
// argument is the literal `null` rather than a querify stringifier object.
//
// nestiaCoreGenerateTypedQueryRoute has its own StringifyNull short-circuit,
// parallel to nestiaCoreGenerateTypedRoute's. The query-route stringify tests
// always pass a string mode, so the null arm of the query-route generator is
// otherwise unreached. A regression that handled null only for plain routes
// would leave query routes stringifying after the consumer opted out.
//
//  1. Transform QueryController with a manifest carrying stringify: null.
//  2. Read the emitted --out source.
//  3. Assert a @TypedQuery route emits a bare null response argument and no
//     URLSearchParams querify body.
func TestTransformQueryRouteStringifyNullEmitsNull(t *testing.T) {
	plugins := `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":null}}]`
	out := transformFileToStringWithPlugins(t, "query", "QueryController.ts", plugins)
	if !strings.Contains(out, `@TypedQuery.Post("body", null)`) {
		t.Fatalf("stringify:null should emit a bare null query-route response argument:\n%s", out)
	}
}
