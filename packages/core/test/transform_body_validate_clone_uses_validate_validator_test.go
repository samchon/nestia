package test

import "testing"

// TestTransformBodyValidateCloneUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validateClone"` through the misc
// MiscValidateCloneProgrammer while recording `type: "validate"`.
//
// validateClone is the report-returning deep-copy variant; it is produced by a
// distinct misc programmer from the throwing assertClone path and from the
// plain validate path. A regression in the switch would emit the wrong cloner.
//
//  1. Transform the body controller with validate "validateClone".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
func TestTransformBodyValidateCloneUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validateClone", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
