package test

import (
	"strings"
	"testing"
)

// TestTransformHeadersValidateUsesValidateProgrammer verifies the @TypedHeaders
// generator selects the HttpValidateHeaders programmer for validate-family
// modes, recording `type: "validate"`.
//
// nestiaCoreGenerateTypedHeaders has three arms keyed on the validate prefix:
// is/equals → is, validate* → validate, else → assert. This drives the
// validate arm, which the assert-mode headers test does not reach, pinning the
// `strings.HasPrefix(category, "validate")` branch.
//
//  1. Transform the headers feature's HeadersController with validate "validate".
//  2. Read the emitted --out source.
//  3. Assert the header validator metadata records the validate type.
func TestTransformHeadersValidateUsesValidateProgrammer(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "validate", "assert")
	if !strings.Contains(out, `type: "validate"`) {
		t.Fatalf("validate-mode headers did not record validate type:\n%s", out)
	}
}
