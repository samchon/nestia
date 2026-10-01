package test

import "testing"

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
//
// @evidence contracts/testing.md#behavioral-verification The headers fixture transform must replace the empty TypedHeaders call with an object argument, detecting missing header validator injection.
// @evidence contracts/testing.md#independent-expectations TypedHeaders receives a generated validator object under the supported assert option; the fixture initially supplies no such object.
// @evidence contracts/testing.md#distinguishing-cases This owns assert-mode injection only; headers is/validate cases pin their discriminators and actual SDK header requests own accepted and rejected wire values.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformHeadersGeneratesValidator(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "assert", "assert")
	mustDecorateAll(t, out, `@core\.TypedHeaders`, "assert")
}
