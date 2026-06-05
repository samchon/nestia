package test

import "testing"

// TestTransformRouteStringifyValidateUsesValidateStringifier verifies the
// @TypedRoute response generator emits a typia `validate` JSON stringifier when
// the core plugin runs with `stringify: "validate"`.
//
// The validate branch of nestiaCoreGenerateTypedRoute threads the response
// through JsonValidateStringifyProgrammer and records `type: "validate"`; it is
// the only stringify arm that produces a validation report before serializing.
// A regression would silently drop the report.
//
//  1. Transform the body controller with stringify "validate".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the validate type.
func TestTransformRouteStringifyValidateUsesValidateStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "validate")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "validate"`)
}
