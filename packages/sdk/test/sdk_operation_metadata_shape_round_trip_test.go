package test

import (
	"encoding/json"
	"testing"
)

// Verifies the JSON literal injected via __OperationMetadata.OperationMetadata
// round-trips into the IOperationMetadata shape defined in
// packages/sdk/src/structures/IOperationMetadata.ts.
//
// Some sibling tests only substring-match key fragments, so a Go-side field
// rename or removal would still pass them. This one parses the native
// literal as JSON and asserts every required top-level and parameter key
// is present. Separate tests own associated type and schema values.
//
//  1. Analyze TypedBodyController with the SDK operation in-process.
//  2. Decode the store metadata through independent JSON unmarshalling.
//  3. Assert required keys on the root, parameters, and success objects.
//
// @evidence contracts/testing.md#behavioral-verification The native decorator JSON must decode independently and retain required operation, parameter and success keys with parameter names as strings and exceptions as an array.
// @evidence contracts/testing.md#independent-expectations The test declares required keys from the TypeScript IOperationMetadata consumer protocol rather than decoding through the producer's Go struct.
// @evidence contracts/testing.md#distinguishing-cases Nonempty parameters prevent a vacuous field loop; parameter objects, names, success object and exception array are checked. Separate schema tests own values and absent optional fields.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKOperationMetadataShapeRoundTrip(t *testing.T) {
	_, prog := loadFeatureProgram(t, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	defer prog.Close()
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 2 {
		t.Fatalf("expected store and update metadata, got %d", len(literals))
	}
	update := decodeSyntheticMetadata(t, literals[1])
	updateParameters := syntheticField(t, update, "parameters").([]any)
	if len(updateParameters) != 2 {
		t.Fatalf("update must carry id and input parameters, got %v", updateParameters)
	}
	input := updateParameters[1]
	if actual := canonicalJSON(t, syntheticField(t, input, "type")); actual != `{"name":"IBbsArticle.IUpdate"}` {
		t.Fatalf("update body type = %s, want IBbsArticle.IUpdate", actual)
	}
	imports := syntheticField(t, input, "imports").([]any)
	if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["IBbsArticle"]` {
		t.Fatalf("update body imports = %v, want exactly IBbsArticle", imports)
	}
	literal := []byte(literals[0])
	var meta map[string]any
	if err := json.Unmarshal(literal, &meta); err != nil {
		t.Fatalf("OperationMetadata literal is not valid JSON: %v\nliteral=%s", err, literal)
	}
	for _, key := range []string{"parameters", "success", "exceptions", "description", "jsDocTags"} {
		if _, ok := meta[key]; !ok {
			t.Fatalf("IOperationMetadata is missing required key %q\nmeta=%v", key, meta)
		}
	}
	parameters, ok := meta["parameters"].([]any)
	if !ok {
		t.Fatalf("expected parameters to be []any, got %T", meta["parameters"])
	}
	if len(parameters) == 0 {
		t.Fatal("expected at least one parameter in the TypedBodyController fixture")
	}
	for index, raw := range parameters {
		param, ok := raw.(map[string]any)
		if !ok {
			t.Fatalf("parameters[%d] is not an object: %T", index, raw)
		}
		for _, key := range []string{"name", "index", "description", "jsDocTags", "type", "imports", "primitive", "resolved"} {
			if _, ok := param[key]; !ok {
				t.Fatalf("parameters[%d] missing required key %q\nparam=%v", index, key, param)
			}
		}
		if _, ok := param["name"].(string); !ok {
			t.Fatalf("parameters[%d].name should be string, got %T", index, param["name"])
		}
	}
	success, ok := meta["success"].(map[string]any)
	if !ok {
		t.Fatalf("expected success to be an object, got %T", meta["success"])
	}
	for _, key := range []string{"type", "imports", "primitive", "resolved"} {
		if _, ok := success[key]; !ok {
			t.Fatalf("success missing required key %q\nsuccess=%v", key, success)
		}
	}
	if _, ok := meta["exceptions"].([]any); !ok {
		t.Fatalf("expected exceptions to be []any, got %T", meta["exceptions"])
	}
}
