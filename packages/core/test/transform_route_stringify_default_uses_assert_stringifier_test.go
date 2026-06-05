package test

import "testing"

// TestTransformRouteStringifyDefaultUsesAssertStringifier verifies the
// @TypedRoute response generator's default arm emits a typia `assert` JSON
// stringifier when `stringify: "assert"` (the default) is configured.
//
// The default branch of nestiaCoreGenerateTypedRoute uses
// JsonAssertStringifyProgrammer and records `type: "assert"`. This is the most
// common path; pinning it guards against a future stringify-mode addition that
// accidentally diverts the default.
//
//  1. Transform the body controller with stringify "assert".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the assert type.
func TestTransformRouteStringifyDefaultUsesAssertStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "assert")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "assert"`)
}
