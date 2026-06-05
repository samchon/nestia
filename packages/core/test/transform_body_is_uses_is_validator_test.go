package test

import "testing"

// TestTransformBodyIsUsesIsValidator verifies the @TypedBody generator emits a
// typia `is` validator (Equals:false) when the core plugin runs with
// `validate: "is"`.
//
// The is branch of nestiaCoreGenerateTypedBody calls IsProgrammer.Write with
// Equals:false and records `type: "is"`. This is the only non-throwing,
// boolean-returning body validator; a regression that routed it through the
// assert family would change the controller's runtime error behavior.
//
//  1. Transform the body controller with validate "is".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the is type.
func TestTransformBodyIsUsesIsValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "is", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "is"`)
}
