package test

import "testing"

// TestTransformRouteStringifyIsUsesIsStringifier verifies the @TypedRoute
// response generator emits a typia `is` JSON stringifier when the core plugin
// runs with `stringify: "is"`.
//
// nestiaCoreGenerateTypedRoute switches on the stringify mode to pick the JSON
// stringify programmer; the is branch guards the stringify behind a boolean
// type check and records `type: "is"`. A regression in the switch would fall
// through to the assert default and change the response serialization contract.
//
//  1. Transform the body controller with stringify "is".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the is type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten JSON response fixture with mode is must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for JSON response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyIsUsesIsStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "is")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "is"`)
}
