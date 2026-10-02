package test

import "testing"

// TestSyntheticMetadataNullMarkerCollision verifies authored strings cannot
// collide with the SDK metadata serializer's representation of JSON null.
//
// A metadata document contains ordinary user strings in descriptions, constants
// and schemas alongside absent fields that must become null. Replacing a
// reserved string after JSON encoding changes valid user data at every depth.
//
//  1. Analyze a controller whose description and literal return value use the
//     old null-marker spelling, with ordinary and empty-string controls.
//  2. Decode the actual injected metadata and check the authored strings remain
//     strings while absent descriptions and escaped/rest metadata remain null.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must preserve the authored sentinel-like description and string constant instead of replacing either with null; absent metadata fields still decode as null.
// @evidence contracts/testing.md#independent-expectations JSON strings and JSON null are distinct values. The authored TypeScript literals and JSDoc supply expected text independently of the serializer's internal representation.
// @evidence contracts/testing.md#distinguishing-cases The old marker spelling contrasts with an ordinary string and an empty string in the same literal union; a populated method description contrasts with absent constant descriptions and absent escaped/rest members.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go test module discovers this Test. Its existing helper calls the actual native EmitTransform in-process and closes the temporary program; no installed consumer, native executable or product host is created.
func TestSyntheticMetadataNullMarkerCollision(t *testing.T) {
	const marker = "__NESTIA_LITERAL_NULL__"
	const controller = `import core from "@nestia/core";
export class SyntheticController {
  /** __NESTIA_LITERAL_NULL__ */
  @core.TypedRoute.Get("null-marker")
  public value(): "__NESTIA_LITERAL_NULL__" | "ordinary" | "" { return "ordinary"; }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	if actual := syntheticField(t, metadata, "description"); actual != marker {
		t.Errorf("authored description = %v, expected string %q", actual, marker)
	}
	data := syntheticField(t, syntheticField(t, syntheticField(t, metadata, "success"), "primitive"), "data")
	schema := syntheticField(t, data, "metadata")
	for _, field := range []string{"rest", "escaped"} {
		if actual := syntheticField(t, schema, field); actual != nil {
			t.Errorf("absent metadata %s = %v, expected null", field, actual)
		}
	}
	constants := syntheticField(t, schema, "constants").([]any)
	if len(constants) != 1 {
		t.Fatalf("expected one string constant group, got %d", len(constants))
	}
	values := syntheticField(t, constants[0], "values").([]any)
	expected := map[string]bool{marker: true, "ordinary": true, "": true}
	for _, value := range values {
		actual, ok := syntheticField(t, value, "value").(string)
		if !ok || !expected[actual] {
			t.Fatalf("literal constant %v is not an authored string", syntheticField(t, value, "value"))
		}
		delete(expected, actual)
		if description := syntheticField(t, value, "description"); description != nil {
			t.Errorf("absent constant description = %v, expected null", description)
		}
	}
	if len(expected) != 0 {
		t.Fatalf("missing authored constants: %v", expected)
	}
}
