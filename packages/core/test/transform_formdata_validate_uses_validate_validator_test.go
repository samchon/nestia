package test

import (
	"strings"
	"testing"
)

// TestTransformFormDataValidateUsesValidateValidator verifies the
// @TypedFormData.Body generator selects the HttpValidateFormData programmer
// (validator key "validate") for the validate-family modes.
//
// This is the third arm of nestiaCoreGenerateTypedFormDataBody, taken for
// validate / validateEquals / validateClone / validatePrune. The assert and is
// form-data tests cannot reach it, and a regression in the prefix routing would
// keep the assert validator for validate-mode form data, silently dropping the
// detailed validation report shape. The validator object records `type:
// "validate"`, so that string pins the arm.
//
//  1. Transform the multipart feature's MultipartController with validate "validate".
//  2. Read the emitted --out source.
//  3. Assert the form-data validator object records the validate type.
func TestTransformFormDataValidateUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "multipart-form-data", "MultipartController.ts", "validate", "assert")
	if !strings.Contains(out, `type: "validate"`) {
		t.Fatalf("validate-mode form data did not record validate validator type:\n%s", out)
	}
}
