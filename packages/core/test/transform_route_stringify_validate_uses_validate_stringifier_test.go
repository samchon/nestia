package test

import "testing"

// TestTransformRouteStringifyValidateUsesValidateStringifier verifies the
// @TypedRoute response generator emits a typia `validate` JSON stringifier when
// the core plugin runs with `stringify: "validate"`.
//
// The validate branch of nestiaCoreGenerateTypedRoute threads the response
// through JsonValidateStringifyProgrammer and records `type: "validate"`; it is
// the only stringify arm that produces a validation report before serializing.
// A regression would silently drop the report.
//
//  1. Transform the body controller with stringify "validate".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the validate type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten JSON response fixture with mode validate must emit the validate discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported validate option selects the validate runtime protocol for JSON response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns validate's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyValidateUsesValidateStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "validate")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "validate"`)
}
