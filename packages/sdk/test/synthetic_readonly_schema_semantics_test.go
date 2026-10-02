package test

import (
	"strings"
	"testing"
)

// TestSyntheticReadonlySchemaSemantics verifies readonly schema markers use
// checker semantics through aliases, substitution, nesting and inferred types.
//
// @evidence contracts/testing.md#behavioral-verification Actual EmitTransform baked schemas retain readonly array and tuple markers through object properties, generic substitution, nested arrays, nullable branches and inference. Decomposed query properties retain the same markers; mutable aliases with misleading names remain unmarked.
// @evidence contracts/testing.md#independent-expectations The authored TypeScript types declare array immutability separately from readonly object properties. The literal expected marker paths follow those declarations rather than metadata names or the producer's classification helper.
// @evidence contracts/testing.md#distinguishing-cases Two mutable aliases named readonlyMutableAlias and ReadonlyArrayMutable contrast an immutable alias with an ordinary name. Explicit, inferred, generic, nested, nullable, tuple and query positions prevent a root-only fix, while recursive objects check traversal termination.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go module discovers this Test. Existing synthetic helpers load one authored checker program and invoke EmitTransform in-process, closing the program and cleaning inputs without product compilation, consumer installation or a runtime host. The swagger-customizer fixture separately owns document composition.
func TestSyntheticReadonlySchemaSemantics(t *testing.T) {
	const source = `import core from "@nestia/core";
export type readonlyMutableAlias = string[];
export type ReadonlyArrayMutable = number[];
export type Immutable<T> = readonly T[];
export interface Box<T> { items: T; }
export interface Tree { children: readonly Tree[]; }
export interface IUnionReadonly { kind: "readonly"; values: readonly string[]; }
export interface IUnionMutable { kind: "mutable"; values: string[]; }
export class JsonReader { public toJSON(): readonly number[] { return []; } }
export class JsonBox { public toJSON(): { nested: JsonReader } { return null!; } }
export interface ICase {
 mutable: string[];
 misleading: readonlyMutableAlias;
 capitalized: ReadonlyArrayMutable;
 immutable: Immutable<string>;
 tuple: readonly [number, string];
 rest: readonly [number, ...Array<readonly string[]>];
 generic: Box<readonly number[]>;
 nested: Array<{ values: readonly boolean[] }>;
 nullable: readonly string[] | null;
 optionalNullable?: readonly string[] | null;
 voidNullable: readonly number[] | null | void;
 neverNullable: readonly boolean[] | null | never;
 functionNullable: readonly number[] | null | (() => void);
 readonly property: string[];
 tree: Tree;
 choice: IUnionReadonly | IUnionMutable;
 arrays: readonly string[] | number[];
 mergedArrays: readonly string[] | string[];
 json: JsonReader;
 jsonBox: JsonBox;
}
export interface IQuery { keys: readonly string[]; mutable: string[]; }
export class SyntheticController {
 @core.TypedRoute.Get("explicit")
 public explicit(): ICase { return null!; }
 @core.TypedRoute.Get("inferred")
 public inferred() { return { values: ["x"] as const }; }
 @core.TypedRoute.Get("root")
 public root(): readonly [readonly number[]] { return null!; }
 @core.TypedRoute.Get("query")
 public query(@core.TypedQuery() query: IQuery): void {}
}`
	literals := strings.Split(buildSyntheticMetadata(t, source), "\n")
	if len(literals) != 4 {
		t.Fatalf("operation count = %d, want four", len(literals))
	}
	for _, pipe := range []string{"primitive", "resolved"} {
		explicit := syntheticJsonSchema(t, syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "success"), pipe)
		component := func(baked map[string]any, name string) map[string]any {
			return syntheticField(t, syntheticField(t, baked, "components"), "schemas").(map[string]any)[name].(map[string]any)
		}
		properties := syntheticField(t, component(explicit, "ICase"), "properties").(map[string]any)
		marker := func(label string, schema any, expected bool) {
			t.Helper()
			actual, present := schema.(map[string]any)["x-readonly-array"]
			if expected && actual != true || !expected && present {
				t.Errorf("%s/%s readonly marker = %v (present=%v), want %v", pipe, label, actual, present, expected)
			}
		}
		for _, key := range []string{"mutable", "misleading", "capitalized", "property"} {
			marker(key, properties[key], false)
		}
		for _, key := range []string{"immutable", "tuple", "rest"} {
			marker(key, properties[key], true)
		}
		marker("readonly tuple rest element", syntheticField(t, properties["rest"], "additionalItems"), true)
 if syntheticField(t, properties["property"], "readOnly") != true {
			t.Error("readonly object property lost its separate readOnly annotation")
		}
		resolve := func(schema any) map[string]any {
			object := schema.(map[string]any)
			if ref, ok := object["$ref"].(string); ok {
				return component(explicit, strings.TrimPrefix(ref, "#/components/schemas/"))
			}
			return object
		}
		generic := resolve(properties["generic"])
		marker("generic.items", syntheticField(t, generic, "properties").(map[string]any)["items"], true)
		nested := resolve(syntheticField(t, properties["nested"], "items"))
		marker("nested.items.values", syntheticField(t, nested, "properties").(map[string]any)["values"], true)
		for _, nullableKey := range []string{"nullable", "optionalNullable", "voidNullable", "neverNullable", "functionNullable"} {
 nullable := syntheticField(t, properties[nullableKey], "oneOf").([]any)
		arrays := 0
		for _, branch := range nullable {
			if branch.(map[string]any)["type"] == "array" {
				arrays++
				marker("nullable array", branch, true)
			} else {
				marker("nullable non-array", branch, false)
			}
		}
		if arrays != 1 {
			t.Errorf("nullable array branches = %d, want one", arrays)
		}
		}
 for _, branch := range syntheticField(t, properties["arrays"], "oneOf").([]any) {
 marker("array union branch", branch, syntheticField(t, branch, "items").(map[string]any)["type"] == "string")
 }
 marker("merged mutable/readonly array", properties["mergedArrays"], false)
 tree := resolve(properties["tree"])
		marker("tree.children", syntheticField(t, tree, "properties").(map[string]any)["children"], true)
		marker("union readonly", syntheticField(t, component(explicit, "IUnionReadonly"), "properties").(map[string]any)["values"], true)
		marker("union mutable", syntheticField(t, component(explicit, "IUnionMutable"), "properties").(map[string]any)["values"], false)
		if pipe == "primitive" {
			marker("escaped toJSON array", properties["json"], true)
			marker("nested escaped toJSON array", syntheticField(t, resolve(properties["jsonBox"]), "properties").(map[string]any)["nested"], true)
		}
		inferred := syntheticJsonSchema(t, syntheticField(t, decodeSyntheticMetadata(t, literals[1]), "success"), pipe)
		inferredSchema := syntheticField(t, inferred, "schema").(map[string]any)
		inferredObject := inferredSchema
		if ref, ok := inferredSchema["$ref"].(string); ok {
			inferredObject = component(inferred, strings.TrimPrefix(ref, "#/components/schemas/"))
		}
		marker("inferred.values", syntheticField(t, inferredObject, "properties").(map[string]any)["values"], true)
		root := syntheticJsonSchema(t, syntheticField(t, decodeSyntheticMetadata(t, literals[2]), "success"), pipe)
		rootSchema := syntheticField(t, root, "schema").(map[string]any)
		marker("root tuple", rootSchema, true)
		marker("root tuple element", syntheticField(t, rootSchema, "prefixItems").([]any)[0], true)
	}
	query := decodeSyntheticMetadata(t, literals[3])
	parameter := syntheticField(t, query, "parameters").([]any)[0]
	baked := syntheticJsonSchema(t, parameter, "resolved")
	properties := syntheticField(t, baked, "properties").(map[string]any)
	if syntheticField(t, properties["keys"], "x-readonly-array") != true {
		t.Error("decomposed query lost its readonly array marker")
	}
	if _, present := properties["mutable"].(map[string]any)["x-readonly-array"]; present {
		t.Error("decomposed mutable query gained a readonly marker")
	}
}
