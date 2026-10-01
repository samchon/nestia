package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

// Verifies actual SDK metadata analysis preserves recursive collection identity.
//
// EmitTransform's JSON schema bake currently overflows for a recursive tuple.
// This direct owning Analyze observation retains the raw producer graph before
// that separate downstream operation, without replacing its failing regression.
//
//  1. Load one authored program with direct recursive and finite array/tuple
//     returns plus an object-mediated array cycle.
//  2. Analyze every return with the SDK's actual Absorb:true/naming options,
//     retaining complete collection JSON and requiring pointer/name identities.
//
// @evidence contracts/testing.md#behavioral-verification Actual MetadataFactory Analyze uses the SDK's Absorb:true/Constant:true and MetadataCollection_replace for primitive/resolved escape modes. Complete raw serialized collections and pointer rows distinguish direct self-referencing X/T from finite and object-mediated array neighbors.
// @evidence contracts/testing.md#independent-expectations Authored X=X[] and T=[T?] require self references, while ICategory.children crosses an object property. Names come from the declaration and the pinned collection naming contract; no handcrafted metadata supplies the observed rows.
// @evidence contracts/testing.md#distinguishing-cases Recursive array and optional recursive tuple contrast finite number array/tuple and an object-mediated array cycle in both escape modes; exact pointer identity prevents equal-looking copied graphs from concealing loss of a cycle. This observation does not certify JSON schema bake or the downstream SDK writer.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this one Test and loads one temporary language program using the existing synthetic tsconfig helper. Public MetadataFactory/Collection operations run in-process, program/temp lifetime is closed, and no JavaScript emit, product fixture compiler, native host or installation is created. The separate EmitTransform regression remains failing until its schema owner is repaired.
func TestSyntheticRecursiveCollectionAnalysis(t *testing.T) {
	const source = `export type X = X[];
export type T = [T?];
export interface ICategory { children: ICategory[]; }
export class SyntheticController {
  public array(): X { return null!; }
  public tuple(): T { return null!; }
  public category(): ICategory[] { return null!; }
  public finiteArray(): number[] { return null!; }
  public finiteTuple(): [number?] { return null!; }
}
`
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
		t.Fatalf("load recursive analysis program: err=%v diagnostics=%v", err, diagnostics)
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
	if len(methods) != 5 {
		t.Fatalf("expected five authored return nodes, got%d", len(methods))
	}
	for _, escape := range []bool{true, false} {
		collection := schemametadata.NewMetadataCollection(&schemametadata.MetadataCollection_IOptions{
			Replace: schemametadata.MetadataCollection_replace,
		})
		for index, method := range methods {
			result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
				Checker:    prog.Checker,
				Options:    nativefactories.MetadataFactory_IOptions{Escape: escape, Constant: true, Absorb: true},
				Components: collection,
				Type:       prog.Checker.GetTypeFromTypeNode(method.AsMethodDeclaration().Type),
			})
			if !result.Success || result.Data == nil {
				t.Fatalf("return%d escape%v Analyze: %v", index, escape, result.Errors)
			}
			encoded, err := json.Marshal(map[string]any{"metadata": result.Data.ToJSON(), "components": collection.ToJSON()})
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("raw return%d escape%v name%s collection JSON: %s", index, escape, result.Data.GetName(), encoded)
			if index == 1 || index == 4 {
				if len(result.Data.Tuples) != 1 {
					t.Fatalf("return%d tuple count%d", index, len(result.Data.Tuples))
				}
				tuple := result.Data.Tuples[0].Type
				t.Logf("tuple row name=%s recursive=%v component=%p elements=%v", tuple.Name, tuple.Recursive, tuple, tuple.Elements)
				if tuple.Recursive != (index == 1) || len(tuple.Elements) != 1 {
					t.Errorf("return%d tuple recursion/elements=%v/%d", index, tuple.Recursive, len(tuple.Elements))
				}
				if index == 1 && (tuple.Name != "T" || len(tuple.Elements[0].Tuples) != 1 || tuple.Elements[0].Tuples[0].Type != tuple) {
					t.Errorf("recursive tuple must retain T self identity: %+v", tuple)
				}
				continue
			}
			if len(result.Data.Arrays) != 1 {
				t.Fatalf("return%d array count%d", index, len(result.Data.Arrays))
			}
			array := result.Data.Arrays[0].Type
			t.Logf("array row name=%s recursive=%v component=%p element=%p", array.Name, array.Recursive, array, array.Value)
			if array.Recursive != (index == 0) {
				t.Errorf("return%d array recursive=%v, want%v", index, array.Recursive, index == 0)
			}
			if index == 0 && (array.Name != "X" || len(array.Value.Arrays) != 1 || array.Value.Arrays[0].Type != array) {
				t.Errorf("recursive array must retain X self identity: %+v", array)
			}
			if index == 2 {
				if len(array.Value.Objects) != 1 {
					t.Fatalf("category array object count%d", len(array.Value.Objects))
				}
				object := array.Value.Objects[0].Type
				if object.Name != "ICategory" || len(object.Properties) != 1 || len(object.Properties[0].Value.Arrays) != 1 || object.Properties[0].Value.Arrays[0].Type != array {
					t.Errorf("category array must return through its object property: %+v", object)
				}
			}
		}
	}
}
