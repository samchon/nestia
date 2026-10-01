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
//
// @evidence contracts/testing.md#behavioral-verification With stringify null, the body query route must emit the exact path-plus-null decorator argument instead of a serializer object.
// @evidence contracts/testing.md#independent-expectations The documented null option disables response transformation; retaining the authored body route path and passing null is the runtime decorator protocol.
// @evidence contracts/testing.md#distinguishing-cases This owns disabled query serialization; assert/is/validate/plain query cases own enabled conversion. The JSON-route null case owns the other decorator family.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryRouteStringifyNullEmitsNull(t *testing.T) {
	plugins := `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":null}}]`
	out := transformFileToStringWithPlugins(t, "query", "QueryController.ts", plugins)
	if !strings.Contains(out, `@TypedQuery.Post("body", null)`) {
		t.Fatalf("stringify:null should emit a bare null query-route response argument:\n%s", out)
	}
}
