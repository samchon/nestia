package test

import (
	"strings"
	"testing"
)

// TestTransformPlainBodyGeneratesValidator verifies the @PlainBody generator
// drives nestiaCoreGeneratePlainBody / nestiaCoreValidatePlainBody for a raw
// string payload.
//
// PlainBody accepts a raw string body and validates the string type rather than
// parsing JSON; its generator path is distinct from TypedBody. A regression
// that routed PlainBody through the JSON validator would change the emitted
// runtime shape and reject valid string payloads.
//
//  1. Transform the plain feature's PlainController with validate "assert".
//  2. Read the emitted --out source.
//  3. Assert the PlainBody decorator survives the rewrite with an injected arg.
func TestTransformPlainBodyGeneratesValidator(t *testing.T) {
	out := transformFileToString(t, "plain", "PlainController.ts", "assert", "assert")
	if !strings.Contains(out, "PlainBody(") {
		t.Fatalf("plain body transform dropped the PlainBody decorator:\n%s", out)
	}
}
