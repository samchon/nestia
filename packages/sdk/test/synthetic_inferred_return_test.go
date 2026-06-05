package test

import (
	"strings"
	"testing"
)

// Verifies a controller method with no return-type annotation (an inferred
// return) drives the typeNode==nil arm of nestiaSDKReflectType and the
// nil-type-node path of nestiaSDKSchemaPipe.
//
// nestiaSDKMethodReturnTypeNode returns nil when a method omits its return
// annotation, so nestiaSDKReflectType takes its `typeNode == nil` early return
// (the `{"name":"__type"}` arm) and nestiaSDKSchemaPipe must reflect purely from
// the checker type. Every annotated fixture skips that arm; an inferred-return
// synthetic controller is the only in-process driver, run through the exported
// EmitTransform with no disk emit.
//
//  1. Author a controller whose method returns an object literal with no return
//     annotation.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert the inferred success type still produces a metadata schema with the
//     reflected property.
func TestSyntheticInferredReturnReflectsType(t *testing.T) {
	const controller = `import core from "@nestia/core";

export class SyntheticController {
  @core.TypedRoute.Get("inferred")
  public inferred() {
    return { value: 1, label: "x" };
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		`"name":"__type"`,
		`"label"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("inferred-return metadata is missing %q\n%s", expected, meta)
		}
	}
}
