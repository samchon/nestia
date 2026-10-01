package test

import "testing"

// TestTransformRouteStringifyDefaultUsesAssertStringifier verifies the
// @TypedRoute response generator's default arm emits a typia `assert` JSON
// stringifier when `stringify: "assert"` (the default) is configured.
//
// The default branch of nestiaCoreGenerateTypedRoute uses
// JsonAssertStringifyProgrammer and records `type: "assert"`. This is the most
// common path; pinning it guards against a future stringify-mode addition that
// accidentally diverts the default.
//
//  1. Transform the body controller with stringify "assert".
//  2. Read the emitted --out source.
//  3. Assert the route stringifier metadata records the assert type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten JSON response fixture with mode assert must emit the assert discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported assert option selects the assert runtime protocol for JSON response. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns assert's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyDefaultUsesAssertStringifier(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "assert")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "assert"`)
}
