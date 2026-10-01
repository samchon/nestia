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
//
// @evidence contracts/testing.md#behavioral-verification The plain-body transform must retain its decorator and inject _assertGuard with a string expectation. Merely retaining the original empty call cannot pass.
// @evidence contracts/testing.md#independent-expectations PlainBody is a string-only request decorator, so a generated string assertion is required independently of the fixture transform implementation.
// @evidence contracts/testing.md#distinguishing-cases This owns generated string validation; plain-error diagnostic fixtures reject unsupported types and the SDK plain feature owns request transport.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformPlainBodyGeneratesValidator(t *testing.T) {
	out := transformFileToString(t, "plain", "PlainController.ts", "assert", "assert")
	if !strings.Contains(out, "PlainBody(") || !strings.Contains(out, "_assertGuard") || !strings.Contains(out, `expected: "string"`) {
		t.Fatalf("plain body transform did not inject its string assertion:\n%s", out)
	}
}
