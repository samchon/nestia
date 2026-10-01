package test

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	sdk "github.com/samchon/nestia/packages/core/native/transform/schemaprojection"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	factories "github.com/samchon/typia/packages/typia/native/core/factories"
	iterate "github.com/samchon/typia/packages/typia/native/core/programmers/iterate"
	jsonprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers/json"
	metadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

// Verifies schema projection preserves absorbed graph meaning and breaks tuple cycles.
//
// The native schema writer treats tuples inline while naming recursive arrays.
// Its bake input needs named tuple uses without changing the raw producer graph,
// other collection representations, or the components used by property writes.
//
//  1. Analyze one authored program with direct, mutual, mixed and object-mediated
//     cycles plus finite, nullable, rest and escaped Set/Map/Date controls.
//  2. Write projected schemas in both escape modes and require original named
//     refs, collection shapes and one shared property/component graph.
//  3. Compare the raw graph bytes and pointer identities after every operation.
//
// @evidence contracts/testing.md#behavioral-verification Public schemaprojection.Project and public WriteSchemas operate on actual absorbed MetadataFactory results. Direct array/tuple, mutual tuple, mixed array/tuple, nullable/rest tuple and object-mediated/finite twins retain collection structure and refs while raw metadata/components remain byte-identical and self pointers unchanged. Property schema writes reuse the projected root and parent components.
// @evidence contracts/testing.md#independent-expectations Authored X=X[], T=[T?], U=[V?], V=[U?], M=[M[]?], N=[(N|null)?] and R=[string,...R[]] prescribe original component names and recursive edges. Boolean/string/number and escaped Date schema expectations follow their JSON values. Safe finite/object-mediated/Set/Map inputs additionally retain the public writer's existing representations rather than imposing its separate JSON API validator policy.
// @evidence contracts/testing.md#distinguishing-cases Recursive tuples contrast recursive arrays, finite tuples and object-mediated cycles, including mutual edges, nullable elements and rest tails. Primitive/resolved escape modes preserve Set/Map/Date differences; nil projection and repeated equal roots distinguish ownership and fresh invocation state. The original EmitTransform fatal regression separately checks caller wiring.
// @evidence contracts/testing.md#execution-ownership One discoverable SDK Go Test loads one temporary language program and performs in-process Analyze/projection/schema writes only. Program and temp lifetime are released without emit, installed consumer, native binary, product fixture compiler or backend. Each escape mode analyzes nine actual return nodes; projection adds no Analyze call.
func TestSyntheticSchemaProjection(t *testing.T) {
	if sdk.Project(nil) != nil {
		t.Fatal("nil projection must remain nil")
	}
	const source = `export type X = X[];
export type T = [T?];
export type U = [V?];
export type V = [U?];
export type M = [M[]?];
export type N = [(N | null)?];
export type R = [string, ...R[]];
export interface IRich { tuple: [number, string?]; set: Set<string>; map: Map<string,number>; when: Date; repeated: T; again: T; }
export interface ICategory { children: ICategory[]; }
export interface IMediated { child: [IMediated?]; }
export class SyntheticController {
  public x(): X { return null!; }
  public t(): T { return null!; }
  public u(): U { return null!; }
  public m(): M { return null!; }
  public n(): N { return null!; }
  public r(): R { return null!; }
  public rich(): IRich { return null!; }
  public category(): ICategory[] { return null!; }
  public mediated(): IMediated { return null!; }
}`
	temp := t.TempDir()
	dir := filepath.Join(temp, "src")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "SyntheticController.ts"), []byte(source), 0o644); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, repoRoot(t), temp)
	prog, diagnostics, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil || len(diagnostics) != 0 {
		t.Fatalf("load: err=%v diagnostics=%v", err, diagnostics)
	}
	defer prog.Close()
	var methods []*shimast.Node
	var walk func(*shimast.Node)
	walk = func(node *shimast.Node) {
		if node.Kind == shimast.KindMethodDeclaration {
			methods = append(methods, node)
		}
		node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
	}
	for _, file := range prog.SourceFiles() {
		if filepath.Base(file.FileName()) == "SyntheticController.ts" {
			walk(file.AsNode())
		}
	}
	if len(methods) != 9 {
		t.Fatalf("methods%d", len(methods))
	}
	for _, escape := range []bool{true, false} {
		for index, method := range methods {
			collection := metadata.NewMetadataCollection(&metadata.MetadataCollection_IOptions{Replace: metadata.MetadataCollection_replace})
			result := factories.MetadataFactory.Analyze(factories.MetadataFactory_IProps{Checker: prog.Checker, Options: factories.MetadataFactory_IOptions{Escape: escape, Constant: true, Absorb: true}, Components: collection, Type: prog.Checker.GetTypeFromTypeNode(method.AsMethodDeclaration().Type)})
			if !result.Success || result.Data == nil {
				t.Fatalf("return%d Analyze:%v", index, result.Errors)
			}
			raw := result.Data
			encode := func() []byte {
				b, err := json.Marshal(map[string]any{"root": raw.ToJSON(), "components": collection.ToJSON()})
				if err != nil {
					t.Fatal(err)
				}
				return b
			}
			before := encode()
			t.Logf("return%d escape%v raw absorbed graph:%s", index, escape, before)
			projected := sdk.Project(raw)
			if projected == raw || sdk.Project(raw) == projected {
				t.Fatal("projection must own fresh invocation nodes")
			}
			baked := jsonprogrammers.JsonSchemasProgrammer.WriteSchemas(struct {
				Version   string
				Metadatas []*metadata.MetadataSchema
			}{"3.1", []*metadata.MetadataSchema{projected}})
			t.Logf("return%d escape%v projected schemas:%s", index, escape, canonicalJSON(t, baked))
			if !bytes.Equal(before, encode()) {
				t.Errorf("return%d escape%v mutated raw bytes", index, escape)
			}
			if len(baked.Schemas) != 1 || baked.Components == nil {
				t.Fatal("missing schema")
			}
			if index < 6 {
				name := []string{"X", "T", "U", "M", "N", "R"}[index]
				ref := "#/components/schemas/" + name
				if index != 3 && baked.Schemas[0]["$ref"] != ref {
					t.Errorf("%s rootref:%v", name, baked.Schemas[0])
				}
				body := baked.Components.Schemas[name]
				if index == 3 {
					body = baked.Schemas[0]
					if raw.Tuples[0].Type.Recursive || len(raw.Tuples[0].Type.Elements[0].Arrays) != 1 || !raw.Tuples[0].Type.Elements[0].Arrays[0].Type.Recursive {
						t.Fatal("mixed cycle must retain inline tuple and recursive array ownership")
					}
					if raw.Tuples[0].Type.Elements[0].Arrays[0].Type.Value.Tuples[0].Type != raw.Tuples[0].Type {
						t.Fatal("raw mixed tuple/array self pointer changed")
					}
				}
				if body["type"] != "array" {
					t.Errorf("%s body:%v", name, body)
				}
				if index == 0 {
					if canonicalJSON(t, body["items"]) != `{"$ref":"#/components/schemas/X"}` {
						t.Errorf("X items:%v", body["items"])
					}
					if len(raw.Arrays) != 1 || raw.Arrays[0].Type.Value.Arrays[0].Type != raw.Arrays[0].Type {
						t.Fatal("raw X selfpointer changed")
					}
				} else {
					items, ok := body["prefixItems"].([]iterate.JsonSchema)
					if !ok || len(items) != 1 {
						t.Fatalf("%s prefixItems:%v", name, body["prefixItems"])
					}
					switch index {
					case 1:
						if items[0]["$ref"] != ref || raw.Tuples[0].Type.Elements[0].Tuples[0].Type != raw.Tuples[0].Type {
							t.Error("T self ref/pointer")
						}
					case 2:
						if items[0]["$ref"] != "#/components/schemas/V" || canonicalJSON(t, baked.Components.Schemas["V"]["prefixItems"]) != `[{"$ref":"#/components/schemas/U"}]` {
							t.Errorf("mutual tuple:%v", baked.Components.Schemas)
						}
					case 3:
						array := items[0]
						if ref, ok := array["$ref"].(string); ok {
							const prefix = "#/components/schemas/"
							if len(ref) <= len(prefix) || ref[:len(prefix)] != prefix {
								t.Fatalf("mixed invalid ref:%s", ref)
							}
							array = baked.Components.Schemas[ref[len(prefix):]]
						}
						if items[0]["$ref"] != "#/components/schemas/ArrayM" || array["type"] != "array" || canonicalJSON(t, array["items"]) != `{"additionalItems":false,"prefixItems":[{"$ref":"#/components/schemas/ArrayM"}],"type":"array"}` {
							t.Errorf("mixed:%v", items[0])
						}
					case 4:
						if canonicalJSON(t, items[0]) != `{"oneOf":[{"type":"null"},{"$ref":"#/components/schemas/N"}]}` {
							t.Errorf("nullable:%v", items[0])
						}
					case 5:
						if items[0]["type"] != "string" || canonicalJSON(t, body["additionalItems"]) != `{"$ref":"#/components/schemas/R"}` {
							t.Errorf("rest:%v", body)
						}
					}
				}
			} else if index == 6 {
				object := projected.Objects[0].Type
				if object == raw.Objects[0].Type || object.Properties[4].Value.Aliases[0].Type != object.Properties[5].Value.Aliases[0].Type {
					t.Fatal("object isolation/shared metadata identity")
				}
				for propertyIndex, property := range object.Properties {
					key := property.Key.GetSoleLiteral()
					if key == nil {
						t.Fatal("literal key")
					}
					schema := iterate.Json_schema_station(iterate.Json_schema_station_props{BlockNever: true, Components: baked.Components, Attribute: iterate.JsonSchema{}, Metadata: property.Value})
					if *key == "repeated" || *key == "again" {
						if schema["$ref"] != "#/components/schemas/T" {
							t.Errorf("propertyref:%v", schema)
						}
					}
					if *key == "when" && escape {
						if schema["type"] != "string" || schema["format"] != "date-time" {
							t.Errorf("escaped Date:%v", schema)
						}
					}
					if *key == "set" || *key == "map" {
						componentName := map[string]string{"set": "Set", "map": "Map"}[*key]
						if schema["$ref"] != "#/components/schemas/"+componentName || canonicalJSON(t, baked.Components.Schemas[componentName]) != `{"properties":{},"required":[],"type":"object"}` {
							t.Errorf("Set/Map shape:%v", schema)
						}
					}
					if *key != "repeated" && *key != "again" {
						original := jsonprogrammers.JsonSchemasProgrammer.WriteSchemas(struct {
							Version   string
							Metadatas []*metadata.MetadataSchema
						}{"3.1", []*metadata.MetadataSchema{raw.Objects[0].Type.Properties[propertyIndex].Value}})
						if canonicalJSON(t, schema) != canonicalJSON(t, original.Schemas[0]) {
							t.Errorf("safe property %s changed schema: projected%v original%v", *key, schema, original.Schemas[0])
						}
						for name, component := range original.Components.Schemas {
							if canonicalJSON(t, component) != canonicalJSON(t, baked.Components.Schemas[name]) {
								t.Errorf("safe property %s changed component%s", *key, name)
							}
						}
					}
				}
			} else {
				original := jsonprogrammers.JsonSchemasProgrammer.WriteSchemas(struct {
					Version   string
					Metadatas []*metadata.MetadataSchema
				}{"3.1", []*metadata.MetadataSchema{raw}})
				if canonicalJSON(t, baked) != canonicalJSON(t, original) {
					t.Errorf("safe object-mediated twin changed")
				}
			}
			if !bytes.Equal(before, encode()) {
				t.Errorf("return%d changed raw after property writes", index)
			}
		}
	}
}
