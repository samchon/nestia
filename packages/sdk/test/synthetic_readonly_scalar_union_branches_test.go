package test

import (
	"strings"
	"testing"
)

// TestSyntheticReadonlyScalarUnionBranches verifies readonly markers survive
// next to unions whose branches are all terminal scalars.
//
// The readonly traversal skips the per-constituent probe when every oneOf or
// anyOf branch is a terminal scalar schema, because such a branch holds no array
// position. An over-broad skip would silently drop markers from unions that do
// contain an array, from arrays of scalar unions and from object branches, so
// each scalar union here sits beside the adjacent shape that must keep them.
//
//  1. Emit one controller whose response mixes all-scalar unions with unions
//     carrying readonly arrays, a readonly array of a scalar union and a
//     nullable object branch.
//  2. Read the baked schema through both the primitive and resolved pipes.
//  3. Assert scalar unions gain no marker while every readonly array position
//     beside them keeps its marker and mutable arrays stay unmarked.
//
// @evidence contracts/testing.md#behavioral-verification Actual EmitTransform baked schemas are inspected for x-readonly-array on each union branch and array position. The assertions fail when the scalar-union skip also covers a union with an array branch, an array whose items are a scalar union, or an object branch, and they permit the skipped scalar unions to stay unmarked.
// @evidence contracts/testing.md#independent-expectations The authored TypeScript types decide immutability: readonly string[] and readonly (string | number)[] are immutable arrays, string[] is mutable, and string | number | null has no array at all. The expected marker for each path follows those declarations, not the traversal's scalar classification.
// @evidence contracts/testing.md#distinguishing-cases Positive skips are string | number | null, a nullable string and a literal union. Each has an adjacent negative one property away: string | readonly string[], number | readonly number[] | null, readonly (string | number)[] and an object-or-null union whose object holds a readonly array. A mutable string | string[] branch checks that the skip does not invent markers. TestSyntheticReadonlySchemaSemantics owns aliases, generics, tuples, recursion, toJSON and query positions.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go module discovers this Test. The shared synthetic helpers load one authored checker program and invoke EmitTransform in-process, closing the program and cleaning inputs without product compilation, consumer installation or a runtime host.
func TestSyntheticReadonlyScalarUnionBranches(t *testing.T) {
	const source = `import core from "@nestia/core";
export interface IHolder { values: readonly string[]; }
export interface ICase {
 scalars: string | number | null;
 nullableString: string | null;
 literals: "a" | "b" | 1;
 scalarOrReadonly: string | readonly string[];
 scalarOrReadonlyNullable: number | readonly number[] | null;
 scalarOrMutable: string | string[];
 readonlyOfScalars: readonly (string | number)[];
 holderOrNull: IHolder | null;
}
export class SyntheticController {
 @core.TypedRoute.Get("explicit")
 public explicit(): ICase { return null!; }
}`
	literals := strings.Split(buildSyntheticMetadata(t, source), "\n")
	if len(literals) != 1 {
		t.Fatalf("operation count = %d, want one", len(literals))
	}
	for _, pipe := range []string{"primitive", "resolved"} {
		baked := syntheticJsonSchema(t, syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "success"), pipe)
		component := func(name string) map[string]any {
			return syntheticField(t, syntheticField(t, baked, "components"), "schemas").(map[string]any)[name].(map[string]any)
		}
		properties := syntheticField(t, component("ICase"), "properties").(map[string]any)
		marker := func(label string, schema any, expected bool) {
			t.Helper()
			actual, present := schema.(map[string]any)["x-readonly-array"]
			if expected && actual != true || !expected && present {
				t.Errorf("%s/%s readonly marker = %v (present=%v), want %v", pipe, label, actual, present, expected)
			}
		}
		branches := func(key string) []any {
			t.Helper()
			for _, keyword := range []string{"oneOf", "anyOf"} {
				if list, ok := properties[key].(map[string]any)[keyword].([]any); ok {
					return list
				}
			}
			return []any{properties[key]}
		}
		for _, key := range []string{"scalars", "nullableString", "literals"} {
			marker(key, properties[key], false)
			for _, branch := range branches(key) {
				if kind := branch.(map[string]any)["type"]; kind == "array" {
					t.Errorf("%s/%s gained an array branch", pipe, key)
				}
				marker(key+" branch", branch, false)
			}
		}
		arrayBranches := func(key string, expected bool) {
			t.Helper()
			arrays := 0
			for _, branch := range branches(key) {
				if branch.(map[string]any)["type"] == "array" {
					arrays++
					marker(key+" array branch", branch, expected)
				} else {
					marker(key+" scalar branch", branch, false)
				}
			}
			if arrays != 1 {
				t.Errorf("%s/%s array branches = %d, want one", pipe, key, arrays)
			}
		}
		arrayBranches("scalarOrReadonly", true)
		arrayBranches("scalarOrReadonlyNullable", true)
		arrayBranches("scalarOrMutable", false)
		marker("readonlyOfScalars", properties["readonlyOfScalars"], true)
		items := syntheticField(t, properties["readonlyOfScalars"], "items")
		marker("readonlyOfScalars.items", items, false)
		holders := 0
		for _, branch := range branches("holderOrNull") {
			object := branch.(map[string]any)
			if ref, ok := object["$ref"].(string); ok {
				object = component(strings.TrimPrefix(ref, "#/components/schemas/"))
			}
			if object["type"] == "null" {
				marker("holderOrNull null branch", object, false)
				continue
			}
			holders++
			marker("holderOrNull.values", syntheticField(t, object, "properties").(map[string]any)["values"], true)
		}
		if holders != 1 {
			t.Errorf("%s/holderOrNull object branches = %d, want one", pipe, holders)
		}
	}
}
