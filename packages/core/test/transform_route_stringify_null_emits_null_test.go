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
func TestTransformRouteStringifyNullEmitsNull(t *testing.T) {
	plugins := `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":null}}]`
	out := transformFileToStringWithPlugins(t, "body", "TypedBodyController.ts", plugins)
	if !strings.Contains(out, "@core.TypedRoute.Post(null)") {
		t.Fatalf("stringify:null should emit a bare null route response argument:\n%s", out)
	}
}
