package test

import "testing"

// TestTransformBodyValidatePruneUsesValidateValidator verifies the @TypedBody
// generator routes `validate: "validatePrune"` through the misc
// MiscValidatePruneProgrammer while recording `type: "validate"`.
//
// validatePrune is the report-returning excess-property stripper; it is the
// last arm of nestiaCoreGenerateTypedBody's switch and is produced by a distinct
// misc programmer from the throwing assertPrune path. Pinning it keeps every
// prune arm covered.
//
//  1. Transform the body controller with validate "validatePrune".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the validate type.
func TestTransformBodyValidatePruneUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validatePrune", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
