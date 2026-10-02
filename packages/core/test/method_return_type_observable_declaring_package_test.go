package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestMethodReturnTypeObservableDeclaringPackage verifies an Observable is
// unwrapped when rxjs declares it and not when only a folder is named like rxjs.
//
// The helper recognized rxjs by the text "/node_modules/rxjs/" in a declaration
// path and by scanning import statements, so a relocated rxjs was missed and
// another package inside such a folder was unwrapped. The declaring package is
// now the nearest manifest, followed through import aliases.
//
//  1. Author rxjs installed normally, rxjs relocated outside node_modules, and a
//     different package placed under a node_modules/rxjs folder.
//  2. Resolve the return type of a method returning each as a renamed import.
//  3. Assert the first two resolve to their payload and the third keeps its wrapper.
//
// @evidence contracts/testing.md#behavioral-verification NestiaCoreMethodReturnType resolves three real declarations, and the payload member must appear unwrapped exactly for the two rxjs-owned ones, which fails when ownership is read from a path or an import spelling.
// @evidence contracts/testing.md#independent-expectations The package a manifest names owns its declarations, so the expected unwrapping follows from the authored manifests and TypeScript semantics, not from the helper.
// @evidence contracts/testing.md#distinguishing-cases Installed and relocated rxjs are positives, the lookalike folder is the negative twin, and all three use a renamed import so the spelling Observable is never present.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit Test and loads a closed driver program in-process over a t.TempDir project; no compiler host or installation is started.
func TestMethodReturnTypeObservableDeclaringPackage(t *testing.T) {
	root := t.TempDir()
	write := func(location, content string) {
		file := filepath.Join(root, filepath.FromSlash(location))
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	const declaration = "export declare class Observable<T> { subscribe(): T; }\n"
	write("package.json", `{"name":"consumer"}`)
	write("node_modules/rxjs/package.json", `{"name":"rxjs"}`)
	write("node_modules/rxjs/index.d.ts", declaration)
	write("vendor/reactive/package.json", `{"name":"rxjs"}`)
	write("vendor/reactive/index.d.ts", declaration)
	write("vendor/node_modules/rxjs/package.json", `{"name":"not-rxjs"}`)
	write("vendor/node_modules/rxjs/index.d.ts", declaration)
	write("controller.ts", `import { Observable as Aliased } from "rxjs";
import { Observable as Relocated } from "./vendor/reactive";
import { Observable as Lookalike } from "./vendor/node_modules/rxjs";

export class Controller {
  public aliased(): Aliased<{ aliased: string }> { return null as any; }
  public relocated(): Relocated<{ relocated: string }> { return null as any; }
  public lookalike(): Lookalike<{ lookalike: string }> { return null as any; }
}
`)
	write("tsconfig.json", `{"compilerOptions":{"target":"ES2022","module":"commonjs","ignoreDeprecations":"6.0","noLib":true,"strict":true},"files":["controller.ts"]}`)
	prog, diags, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	if len(diags) != 0 {
		t.Fatalf("configuration diagnostics: %v", diags)
	}
	source := prog.SourceFile(filepath.ToSlash(filepath.Join(root, "controller.ts")))
	if source == nil {
		t.Fatal("controller.ts not loaded")
	}
	// the payload each method must resolve to: unwrapped when rxjs owns the
	// declaration, whatever its folder or import spelling, and kept as the
	// wrapper when another package merely lives in a folder named like rxjs
	want := map[string]struct {
		unwrapped bool
		member    string
	}{
		"aliased":   {true, "aliased"},
		"relocated": {true, "relocated"},
		"lookalike": {false, "lookalike"},
	}
	seen := map[string]bool{}
	var walk func(*shimast.Node)
	walk = func(node *shimast.Node) {
		if node.Kind == shimast.KindMethodDeclaration {
			name := transform.NodeName(node)
			expected, ok := want[name]
			if !ok {
				t.Fatalf("unexpected method %q", name)
			}
			seen[name] = true
			typ := transform.NestiaCoreMethodReturnType(prog, node)
			if typ == nil {
				t.Fatalf("%s return type was not resolved", name)
			}
			text := prog.Checker.TypeToString(typ)
			if !strings.Contains(text, expected.member) {
				t.Errorf("%s lost its payload member: %s", name, text)
			}
			if wrapped := strings.Contains(text, "Observable"); wrapped == expected.unwrapped {
				t.Errorf("%s unwrapped = %v, want %v: %s", name, !wrapped, expected.unwrapped, text)
			}
		}
		node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
	}
	walk(source.AsNode())
	for name := range want {
		if !seen[name] {
			t.Errorf("method %s was not visited", name)
		}
	}
}
