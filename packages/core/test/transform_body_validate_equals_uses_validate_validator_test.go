package test

import "testing"

// TestTransformBodyValidateEqualsUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validateEquals"` through ValidateProgrammer with
// Equals:true, recording `type: "validate"`.
//
// validateEquals returns the detailed validation report (rather than throwing)
// and rejects excess properties. It shares the validate runtime tag; a
// regression that dropped the Equals flag would silently accept extras while
// still emitting a report.
//
//  1. Transform the body controller with validate "validateEquals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
func TestTransformBodyValidateEqualsUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validateEquals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
