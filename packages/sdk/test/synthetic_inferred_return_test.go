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
//
// @evidence contracts/testing.md#behavioral-verification An unannotated authored object return must reflect as an inferred __type containing its label field.
// @evidence contracts/testing.md#independent-expectations TypeScript infers an anonymous object from the handwritten return expression; it has a label property independently of SDK metadata output.
// @evidence contracts/testing.md#distinguishing-cases This owns inferred type/field presence; the inferred JavaScript build case owns empty imports and explicit-type reflection cases own named return types.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSyntheticInferredReturnReflectsType(t *testing.T) {
	const controller = `import core from "@nestia/core";

export class SyntheticController {
  @core.TypedRoute.Get("inferred")
  public inferred() {
    return { value: 1, label: "x" };
  }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	success := syntheticField(t, metadata, "success")
	if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != `{"name":"__type"}` {
		t.Fatalf("inferred success type is %s, expected the anonymous {\"name\":\"__type\"}", actual)
	}
	data := syntheticField(t, syntheticField(t, success, "primitive"), "data")
	objects := syntheticField(t, syntheticField(t, data, "components"), "objects").([]any)
	keys := []string{}
	for _, property := range syntheticField(t, objects[0], "properties").([]any) {
		keys = append(keys, syntheticMetadataConstant(t, syntheticField(t, property, "key")).(string))
	}
	if actual := strings.Join(keys, ","); actual != "value,label" {
		t.Fatalf("the reflected object properties are %q, expected value,label", actual)
	}
}
