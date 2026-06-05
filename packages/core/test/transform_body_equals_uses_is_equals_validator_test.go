package test

import "testing"

// TestTransformBodyEqualsUsesIsEqualsValidator verifies the @TypedBody
// generator routes `validate: "equals"` through IsProgrammer with Equals:true
// while still recording `type: "is"`.
//
// The equals branch is distinct from is only in the Equals flag, which makes
// the validator reject excess properties; it shares the is runtime type tag.
// A regression that dropped the Equals flag would silently accept extra
// properties, so this pins the equals arm separately from is.
//
//  1. Transform the body controller with validate "equals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata still records the is type.
func TestTransformBodyEqualsUsesIsEqualsValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "equals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "is"`)
}
