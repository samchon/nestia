package test

import (
	"strings"
	"testing"
)

// TestTransformRouteStringifyNullEmitsNull verifies that a @nestia/core config
// with `stringify: null` disables response stringification: the @TypedRoute
// response argument is emitted as the literal `null` instead of a typia
// stringifier object.
//
// readNestiaCoreOptions sets StringifyNull only when the config key is present
// with a JSON null value (distinct from an absent key, which defaults to assert).
// nestiaCoreGenerateTypedRoute then short-circuits to a NullKeyword before the
// stringify switch. That null arm is unreachable through the helper that always
// emits a string stringify mode, so it needs an explicit null manifest. A
// regression collapsing null into the default would silently re-enable
// stringification a consumer opted out of.
//
//  1. Transform the body controller with a manifest carrying stringify: null.
//  2. Read the emitted --out source.
//  3. Assert the route gained no stringifier object (no `type: "assert"` etc.)
//     and instead carries a bare null response argument.
//
// @evidence contracts/testing.md#behavioral-verification With stringify null, the body JSON route must emit TypedRoute.Post(null) instead of a generated serializer object.
// @evidence contracts/testing.md#independent-expectations The supported null option disables response serialization through the decorator runtime null argument.
// @evidence contracts/testing.md#distinguishing-cases This owns disabled JSON serialization; assert/is/validate/plain modes own generated objects and query-null owns query routes.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyNullEmitsNull(t *testing.T) {
	plugins := `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":null}}]`
	out := transformFileToStringWithPlugins(t, "body", "TypedBodyController.ts", plugins)
	if !strings.Contains(out, "@core.TypedRoute.Post(null)") {
		t.Fatalf("stringify:null should emit a bare null route response argument:\n%s", out)
	}
}
