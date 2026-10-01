package test

import (
	"strings"
	"testing"
)

// Verifies SDK collection metadata preserves direct recursive collection references.
//
// Absorb:true removes alias wrappers, so a recursive array or tuple must retain
// its own component identity. An object-mediated array cycle and finite neighbors
// distinguish those direct collection cycles from ordinary nested declarations.
//
//  1. Analyze direct recursive array/optional tuple, object-mediated array and
//     finite array/tuple returns through the actual SDK EmitTransform.
//  2. Retain complete serialized primitive/resolved graphs and require their
//     component names, recursion flags and element reference identities.
//
// @evidence contracts/testing.md#behavioral-verification Actual SDK EmitTransform serializes primitive and resolved collection graphs for X=X[], T=[T?], ICategory.children:ICategory[], number[] and optional-number tuple; root/component/element names and recursion flags must preserve direct self references while finite and object-mediated array neighbors remain distinct.
// @evidence contracts/testing.md#independent-expectations The two authored aliases refer directly to themselves; the category array crosses an object property before returning to its array. The pinned MetadataFactory recursion walk distinguishes those edges, and the SDK owns Absorb:true plus MetadataCollection_replace naming. Complete emitted JSON is logged rather than inferred from authored synthetic metadata.
// @evidence contracts/testing.md#distinguishing-cases Recursive array and optional recursive tuple contrast an object-mediated array cycle and finite array/tuple; primitive and resolved pipes each retain independent serialized references. This proves producer graph shape, not downstream TypeScript writer correctness or runtime validation.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this one Test. Existing buildSyntheticMetadata owns one temporary language program and invokes exported EmitTransform in-process; program closure and temp cleanup are shared, without JavaScript output, product fixture compilation, native host or consumer installation.
func TestSyntheticRecursiveCollectionMetadata(t *testing.T) {
	const source = `import core from "@nestia/core";
export type X = X[];
export type T = [T?];
export interface ICategory { children: ICategory[]; }
export class SyntheticController {
  @core.TypedRoute.Get("array")
  public array(): X { return null!; }
  @core.TypedRoute.Get("tuple")
  public tuple(): T { return null!; }
  @core.TypedRoute.Get("category")
  public category(): ICategory[] { return null!; }
  @core.TypedRoute.Get("finite-array")
  public finiteArray(): number[] { return null!; }
  @core.TypedRoute.Get("finite-tuple")
  public finiteTuple(): [number?] { return null!; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, source), "\n")
	if len(literals) != 5 {
		t.Fatalf("expected five collection operations, got %d", len(literals))
	}
	for index, literal := range literals {
		t.Logf("collection[%d] complete operation metadata: %s", index, literal)
	}
	for index, literal := range literals {
		operation := decodeSyntheticMetadata(t, literal)
		success := syntheticField(t, operation, "success")
		for _, pipe := range []string{"primitive", "resolved"} {
			data := syntheticField(t, syntheticField(t, success, pipe), "data")
			metadata := syntheticField(t, data, "metadata")
			components := syntheticField(t, data, "components")
			kind := "arrays"
			if index == 1 || index == 4 {
				kind = "tuples"
			}
			roots := syntheticField(t, metadata, kind).([]any)
			rows := syntheticField(t, components, kind).([]any)
			if len(roots) != 1 || len(rows) != 1 {
				t.Errorf("operation%d/%s %s roots/rows = %d/%d, want1/1", index, pipe, kind, len(roots), len(rows))
				continue
			}
			name := syntheticField(t, rows[0], "name")
			if rootName := syntheticField(t, roots[0], "name"); rootName != name {
				t.Errorf("operation%d/%s root %v differs from component %v", index, pipe, rootName, name)
			}
			recursive := index < 2
			if actual := syntheticField(t, rows[0], "recursive"); actual != recursive {
				t.Errorf("operation%d/%s recursive=%v, want%v", index, pipe, actual, recursive)
			}
			if index < 2 {
				want := []string{"X", "T"}[index]
				if name != want {
					t.Errorf("operation%d/%s component name=%v, want%s", index, pipe, name, want)
				}
				var value any
				if kind == "tuples" {
					elements := syntheticField(t, rows[0], "elements").([]any)
					if len(elements) != 1 {
						t.Errorf("recursive tuple/%s has %d elements, want1", pipe, len(elements))
						continue
					}
					value = elements[0]
				} else {
					value = syntheticField(t, rows[0], "value")
				}
				refs := syntheticField(t, value, kind).([]any)
				if len(refs) != 1 || syntheticField(t, refs[0], "name") != name {
					t.Errorf("operation%d/%s self reference=%v, want component%s", index, pipe, refs, want)
				}
			}
			if index == 2 {
				objects := syntheticField(t, components, "objects").([]any)
				if len(objects) != 1 || syntheticField(t, objects[0], "name") != "ICategory" {
					t.Errorf("object-mediated/%s objects=%v, want ICategory", pipe, objects)
					continue
				}
				value := syntheticField(t, rows[0], "value")
				refs := syntheticField(t, value, "objects").([]any)
				if len(refs) != 1 || syntheticField(t, refs[0], "name") != "ICategory" {
					t.Errorf("object-mediated/%s array element=%v, want ICategory", pipe, refs)
				}
				properties := syntheticField(t, objects[0], "properties").([]any)
				if len(properties) != 1 {
					t.Errorf("object-mediated/%s property count=%d, want1", pipe, len(properties))
					continue
				}
				children := syntheticField(t, properties[0], "value")
				arrays := syntheticField(t, children, "arrays").([]any)
				if len(arrays) != 1 || syntheticField(t, arrays[0], "name") != name {
					t.Errorf("object-mediated/%s children array=%v, want component %v", pipe, arrays, name)
				}
			}
		}
	}
}
