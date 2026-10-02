package test

import (
	"strings"
	"testing"
)

// Verifies typeof and Promise annotations retain their response meaning.
//
// The typeof response preserves its authored text and checker-derived numeric
// property schema. The Promise response exposes its IPoint payload.
//
//  1. Author a controller with a `typeof`-typed method and a `Promise<IPoint>`
//     method.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert the typeof success type and the unwrapped Promise element both
//     surface in the metadata.
//
// @evidence contracts/testing.md#behavioral-verification The success type of the Promise<IPoint> method must be exactly IPoint with no Promise wrapper, and the typeof method must keep its annotation text while its baked schema carries the inferred numeric value property.
// @evidence contracts/testing.md#independent-expectations Awaited route responses expose Promise's element type and typeof sample denotes the authored sample object rather than a nominal wrapper.
// @evidence contracts/testing.md#distinguishing-cases The exact success type of each method separates unwrapping from leaking the wrapper; the typeof schema property pins the checker fallback, complementary to explicit/inferred nested reflection cases.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticReflectTypeQueryAndPromiseUnwrap(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IPoint {
  x: number;
  y: number;
}

const sample = { value: 1 };

export class SyntheticController {
  @core.TypedRoute.Get("typeof")
  public typeofValue(): typeof sample {
    return sample;
  }

  @core.TypedRoute.Get("promise")
  public async promised(): Promise<IPoint> {
    return { x: 0, y: 0 };
  }
}
`
	// One metadata literal per method, in source order. The Promise<IPoint> return
	// unwraps to IPoint rather than naming Promise, and the typeof return keeps the
	// annotation text while its resolved schema holds the inferred object.
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 2 {
		t.Fatalf("expected 2 operations, got %d", len(literals))
	}
	for index, expected := range []string{`{"name":"typeof sample"}`, `{"name":"IPoint"}`} {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != expected {
			t.Fatalf("operation %d success type is %s, expected %s", index, actual, expected)
		}
	}
	typeofSuccess := syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "success")
	baked := syntheticJsonSchema(t, typeofSuccess, "resolved")
	if !strings.Contains(canonicalJSON(t, baked), `"value":{"type":"number"}`) {
		t.Fatalf("typeof return schema is missing the inferred value property: %v", baked)
	}
}
