package test

import (
	"strings"
	"testing"
)

// TestTransformFormDataIsUsesIsValidator verifies the @TypedFormData.Body
// generator selects the HttpIsFormData programmer (validator key "is") for
// is/equals modes.
//
// nestiaCoreGenerateTypedFormDataBody collapses the validate option down to
// {assert, is, validate} like the headers/query generators; the is arm is taken
// only for "is"/"equals" and is unreachable from the assert and validate
// form-data tests. A regression in the prefix routing would silently keep the
// assert validator for is-mode form data. The validator object records its key
// as `type: "is"`, so that string pins the arm.
//
//  1. Transform the multipart feature's MultipartController with validate "is".
//  2. Read the emitted --out source.
//  3. Assert the form-data validator object records the is type.
func TestTransformFormDataIsUsesIsValidator(t *testing.T) {
	out := transformFileToString(t, "multipart-form-data", "MultipartController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode form data did not record is validator type:\n%s", out)
	}
}
