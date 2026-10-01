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
// reach. A regression in the prefix check would misroute is-mode headers to
// the assert programmer.
//
//  1. Transform the headers feature's HeadersController with validate "is".
//  2. Read the emitted --out source.
//  3. Assert the header validator metadata records the is type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten headers fixture with mode is must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for headers. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformHeadersIsUsesIsProgrammer(t *testing.T) {
	out := transformFileToString(t, "headers", "HeadersController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode headers did not record is type:\n%s", out)
	}
}
