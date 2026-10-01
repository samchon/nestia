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
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten form data fixture with mode is must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for form data. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformFormDataIsUsesIsValidator(t *testing.T) {
	out := transformFileToString(t, "multipart-form-data", "MultipartController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode form data did not record is validator type:\n%s", out)
	}
}
