package test

import (
	"strings"
	"testing"
)

// TestTransformHeadersGeneratesValidator verifies the @TypedHeaders generator
// injects a header validator (nestiaCoreGenerateTypedHeaders) into the
// decorator call.
//
// Header validation reuses the typia HttpAssertHeaders / HttpValidateHeaders /
// HttpIsHeaders programmer family, collapsing the 10-mode validate option down
// to {assert, is, validate}. The dispatch table maps TypedHeaders to its own
// programmer kind; a regression in that mapping would emit no validator for
// header parameters.
//
//  1. Transform the headers feature's HeadersController with validate "assert".
//  2. Read the emitted --out source.
//  3. Assert the TypedHeaders decorator gained an injected validator object.
func TestTransformHeadersGeneratesValidator(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "assert", "assert")
	if !strings.Contains(out, "@core.TypedHeaders({") {
		t.Fatalf("headers transform did not inject a validator object:\n%s", out)
	}
}
