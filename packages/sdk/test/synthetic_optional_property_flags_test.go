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

// Verifies native optional-property metadata distinguishes compiler premises.
//
// Exact optional assignment excludes undefined unless the authored value union
// explicitly includes it. A producer with that flag disabled cannot be assumed
// to supply the same flags to a clone writer checked under the enabled premise.
//
//  1. Load the same three-property language input under false and true premises.
//  2. Analyze its return through the SDK's owning metadata options and retain raw
//     rows while checking omission separately from explicit undefined.
//
// @evidence contracts/testing.md#behavioral-verification Actual MetadataFactory Analyze observes required/optional flags for a?:boolean, b?:boolean|undefined and c:boolean|undefined under each explicit compiler premise. Raw serialized collections retain the extraction evidence for the downstream writer.
// @evidence contracts/testing.md#independent-expectations TypeScript exact optional semantics exclude explicit undefined for a only when enabled; b and c explicitly include undefined in both modes, while only a and b permit omission. No authored metadata substitutes for native extraction.
// @evidence contracts/testing.md#distinguishing-cases Adjacent implicit and explicit undefined properties contrast a required undefinable neighbor, and the same source differs only in exactOptionalPropertyTypes. This unit does not certify generated consumer assignment controls or transport.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this one Test and loads two necessary language programs, one per incompatible compiler premise, with the existing synthetic config helper. Analyze runs in-process; programs and temporary files are released without JavaScript emit, product fixture compiler, installation or host.
func TestSyntheticOptionalPropertyFlags(t *testing.T) {
	for _, exact := range []bool{false, true} {
		temp := t.TempDir()
		dir := filepath.Join(temp, "src")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "SyntheticController.ts"), []byte(`export class SyntheticController {
  public sample(): { a?: boolean; b?: boolean | undefined; c: boolean | undefined } { return null!; }
}`), 0o644); err != nil {
			t.Fatal(err)
		}
		writeSyntheticTsconfig(t, repoRoot(t), temp)
		configPath := filepath.Join(temp, "tsconfig.json")
		encoded, err := os.ReadFile(configPath)
		if err != nil {
			t.Fatal(err)
		}
		var config map[string]any
		if err := json.Unmarshal(encoded, &config); err != nil {
			t.Fatal(err)
		}
		config["compilerOptions"].(map[string]any)["exactOptionalPropertyTypes"] = exact
		encoded, err = json.Marshal(config)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(configPath, encoded, 0o644); err != nil {
			t.Fatal(err)
		}
		prog, diagnostics, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
		if err != nil || len(diagnostics) != 0 {
			t.Fatalf("exact%v load: err=%v diagnostics=%v", exact, err, diagnostics)
		}
		func() {
			defer prog.Close()
			var method *shimast.Node
			var walk func(*shimast.Node)
			walk = func(node *shimast.Node) {
				if node.Kind == shimast.KindMethodDeclaration {
					method = node
				}
				node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
			}
			for _, file := range prog.SourceFiles() {
				if filepath.Base(file.FileName()) == "SyntheticController.ts" {
					walk(file.AsNode())
				}
			}
			if method == nil {
				t.Fatal("authored method missing")
			}
			collection := schemametadata.NewMetadataCollection(&schemametadata.MetadataCollection_IOptions{Replace: schemametadata.MetadataCollection_replace})
			result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
				Checker: prog.Checker, Options: nativefactories.MetadataFactory_IOptions{Escape: true, Constant: true, Absorb: true}, Components: collection,
				Type: prog.Checker.GetTypeFromTypeNode(method.AsMethodDeclaration().Type),
			})
			if !result.Success || result.Data == nil {
				t.Fatalf("exact%v Analyze: %v", exact, result.Errors)
			}
			encoded, err := json.Marshal(map[string]any{"metadata": result.Data.ToJSON(), "components": collection.ToJSON()})
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("exact%v raw property graph: %s", exact, encoded)
			if len(result.Data.Objects) != 1 || len(result.Data.Objects[0].Type.Properties) != 3 {
				t.Fatal("expected three authored properties")
			}
			for index, property := range result.Data.Objects[0].Type.Properties {
				wantRequired := exact && index == 0
				wantOptional := index < 2
				t.Logf("exact%v property%d required=%v optional=%v", exact, index, property.Value.Required, property.Value.Optional)
				if property.Value.Required != wantRequired || property.Value.Optional != wantOptional {
					t.Errorf("exact%v property%d required/optional=%v/%v want%v/%v", exact, index, property.Value.Required, property.Value.Optional, wantRequired, wantOptional)
				}
			}
		}()
	}
}
