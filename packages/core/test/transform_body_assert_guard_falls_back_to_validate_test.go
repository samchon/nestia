package test

import "testing"

// TestTransformBodyAssertGuardFallsBackToValidate verifies the @TypedBody
// generator's default arm: an unrecognized validate mode (here "assertGuard",
// which @TypedBody does not special-case) is generated as a typia `validate`
// validator recording `type: "validate"`.
//
// nestiaCoreGenerateTypedBody only special-cases the assert / is / equals /
// clone / prune families; everything else — including assertGuard — falls
// through to ValidateProgrammer. This pins the default branch so a future mode
// addition that should be special-cased cannot silently regress to validate.
//
//  1. Transform the body controller with validate "assertGuard".
//  2. Read the emitted --out source.
//  3. Assert the default validate type tag is emitted.
func TestTransformBodyAssertGuardFallsBackToValidate(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assertGuard", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "validate"`)
}
