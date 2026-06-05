package test

import "testing"

// TestTransformRouteStringifyPlainUsesStringifyStringifier verifies the
// @TypedRoute response generator emits a typia `stringify` (no-validation) JSON
// stringifier when the core plugin runs with `stringify: "stringify"`.
//
// The stringify branch of nestiaCoreGenerateTypedRoute uses
// JsonStringifyProgrammer, which skips validation entirely and records
// `type: "stringify"`. A regression that routed it through assert would add an
// unintended validation cost to a route that opted out.
//
//  1. Transform the body controller with stringify "stringify".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the stringify type.
func TestTransformRouteStringifyPlainUsesStringifyStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "stringify")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "stringify"`)
}
