package test

import "testing"

// TestTransformRouteStringifyPlainUsesStringifyStringifier verifies the
// @TypedRoute response generator emits a typia `stringify` (no-validation) JSON
// stringifier when the core plugin runs with `stringify: "stringify"`.
//
// The stringify branch of nestiaCoreGenerateTypedRoute uses
// JsonStringifyProgrammer, which skips validation entirely and records
// `type: "stringify"`. A regression that routed it through assert would add an
// unintended validation cost to a route that opted out.
//
//  1. Transform the body controller with stringify "stringify".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the stringify type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten JSON response fixture with mode stringify must emit the stringify discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported stringify option selects the stringify runtime protocol for JSON response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns stringify's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyPlainUsesStringifyStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "stringify")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "stringify"`)
}
