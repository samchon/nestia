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
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten form data fixture with mode validate must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validate option selects the validate runtime protocol for form data. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validate's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformFormDataValidateUsesValidateValidator(t *testing.T) {
	out := transformFileToString(t, "multipart-form-data", "MultipartController.ts", "validate", "assert")
	if !strings.Contains(out, `type: "validate"`) {
		t.Fatalf("validate-mode form data did not record validate validator type:\n%s", out)
	}
}
