package test

import (
	"strings"
	"testing"
)

// TestTransformHeadersIsUsesIsProgrammer verifies the @TypedHeaders generator
// selects the HttpIsHeaders programmer for `is`/`equals` modes, recording
// `type: "is"`.
//
// This drives the first arm of nestiaCoreGenerateTypedHeaders (category == "is"
// || "equals"), the only arm that the assert and validate header tests cannot
// reach. A regression in the prefix check would mis-route is-mode headers to
// the assert programmer.
//
//  1. Transform the headers feature's HeadersController with validate "is".
//  2. Read the emitted --out source.
//  3. Assert the header validator metadata records the is type.
func TestTransformHeadersIsUsesIsProgrammer(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode headers did not record is type:\n%s", out)
	}
}
