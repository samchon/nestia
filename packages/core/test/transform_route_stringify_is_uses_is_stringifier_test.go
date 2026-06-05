package test

import "testing"

// TestTransformRouteStringifyIsUsesIsStringifier verifies the @TypedRoute
// response generator emits a typia `is` JSON stringifier when the core plugin
// runs with `stringify: "is"`.
//
// nestiaCoreGenerateTypedRoute switches on the stringify mode to pick the JSON
// stringify programmer; the is branch guards the stringify behind a boolean
// type check and records `type: "is"`. A regression in the switch would fall
// through to the assert default and change the response serialization contract.
//
//  1. Transform the body controller with stringify "is".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the is type.
func TestTransformRouteStringifyIsUsesIsStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "is")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "is"`)
}
