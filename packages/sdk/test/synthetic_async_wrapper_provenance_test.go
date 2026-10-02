package test

import (
	"strings"
	"testing"
)

// Verifies asynchronous reflection unwraps library Promise, preserving a user wrapper.
//
// A same-spelled generic inside a user namespace is an ordinary response object;
// treating it as asynchronous loses its member and its declaring import.
//
//  1. Analyze global Promise, nested global Promise and Foreign.Promise returns.
//  2. Compare their complete reflected trees and the foreign declaration import.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform unwraps both global asynchronous returns to IPoint but preserves Foreign.Promise<IPoint> and its namespace import.
// @evidence contracts/testing.md#independent-expectations Awaited TypeScript library Promise exposes its element recursively; Foreign.Promise is the authored object interface carrying value, without thenable behavior.
// @evidence contracts/testing.md#distinguishing-cases Single and nested global wrappers contrast a user namespace wrapper one spelling away; exact reflected trees and Foreign import catch indiscriminate name-based unwrapping.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this Test and invokes native EmitTransform over authored parse/checker input, with program closure and no consumer installation, product build or runtime host.
func TestSyntheticAsyncWrapperProvenance(t *testing.T) {
	const controller = `import core from "@nestia/core";
export interface IPoint { x: number; }
export namespace Foreign { export interface Promise<T> { value: T; } }
export class SyntheticController {
  @core.TypedRoute.Get("global")
  public global(): Promise<IPoint> { return null!; }
  @core.TypedRoute.Get("nested")
  public nested(): Promise<Promise<IPoint>> { return null!; }
  @core.TypedRoute.Get("foreign")
  public foreign(): Foreign.Promise<IPoint> { return null!; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	expected := []string{
		`{"name":"IPoint"}`,
		`{"name":"IPoint"}`,
		`{"name":"Foreign.Promise","typeArguments":[{"name":"IPoint"}]}`,
	}
	if len(literals) != len(expected) {
		t.Fatalf("expected three operations, got %d", len(literals))
	}
	for index, tree := range expected {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != tree {
			t.Errorf("operation %d type = %s, want %s", index, actual, tree)
		}
	}
	foreign := syntheticField(t, decodeSyntheticMetadata(t, literals[2]), "success")
	imports := syntheticField(t, foreign, "imports").([]any)
	found := false
	for _, entry := range imports {
		for _, name := range syntheticField(t, entry, "elements").([]any) {
			if name == "Foreign" {
				found = true
			}
		}
	}
	if !found {
		t.Fatalf("foreign namespace declaration import missing: %v", imports)
	}
	baked := syntheticJsonSchema(t, foreign, "resolved")
	schemas := syntheticField(t, syntheticField(t, baked, "components"), "schemas").(map[string]any)
	wrappers := 0
	for _, schema := range schemas {
		object, ok := schema.(map[string]any)
		if !ok {
			continue
		}
		properties, ok := object["properties"].(map[string]any)
		if !ok {
			continue
		}
		value, exists := properties["value"]
		if !exists {
			continue
		}
		wrappers++
		if actual := canonicalJSON(t, value); actual != `{"$ref":"#/components/schemas/IPoint"}` {
			t.Errorf("foreign wrapper value schema = %s, want IPoint reference", actual)
		}
		if actual := canonicalJSON(t, object["required"]); actual != `["value"]` {
			t.Errorf("foreign wrapper required = %s, want value", actual)
		}
	}
	if wrappers != 1 {
		t.Fatalf("foreign wrapper object count = %d, want one value-bearing interface", wrappers)
	}
}
