package test

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestIsNestiaCoreCallPackageOwnership verifies resolved declaration ownership,
// independently of the directory spelling or the local import binding.
//
// Consumers can name an unrelated workspace packages/core, and dependencies can
// carry a nested foreign package. Neither declaration belongs to nestia. A real
// core package can also be linked under a different directory or re-exported;
// its resolved declaration still belongs to the same nearest package manifest.
//
//  1. Author foreign lookalikes, nested foreign packages and actual-name packages.
//  2. Load one TypeScript program with aliased and re-exported call signatures.
//  3. Require every authored ownership verdict and reject an unresolved call.
//
// @evidence contracts/testing.md#behavioral-verification IsNestiaCoreCall judges actual resolved signatures in one driver program; foreign and nested-foreign declarations must be false, real-name and re-exported real declarations true, and an unresolved call false. Every named call must be visited.
// @evidence contracts/testing.md#independent-expectations Handwritten package manifests identify the owner and literal expected booleans are assigned before loading the program; no current detector output generates the expectations.
// @evidence contracts/testing.md#distinguishing-cases Both lib and src/decorators lookalikes, both nested foreign layouts, invalid/unnamed nearest manifests, ordinary installed core, relocated core, a renamed local binding, a transparent re-export, an unresolved call and absent program/source inputs distinguish path matching from closest-manifest ownership.
// @evidence contracts/testing.md#execution-ownership The canonical core Go runner discovers this matching Test, loads and closes a real driver program in-process, and t.TempDir owns all fixture files. No host binary, CLI, runtime server or shared workspace package is changed.
func TestIsNestiaCoreCallPackageOwnership(t *testing.T) {
	root := t.TempDir()
	write := func(location, content string) {
		t.Helper()
		file := filepath.Join(root, filepath.FromSlash(location))
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write("package.json", `{"name":"foreign-consumer"}`)
	cases := []struct {
		binding, location, manifest, contents string
		want                                  bool
	}{
		{"foreignLib", "packages/core/lib/decorator", "packages/core", `{"name":"foreign-core"}`, false},
		{"foreignSource", "foreign/packages/core/src/decorators/decorator", "foreign/packages/core", `{"name":"foreign-core"}`, false},
		{"nestedLib", "node_modules/@nestia/core/lib/foreign/decorator", "node_modules/@nestia/core/lib/foreign", `{"name":"foreign-child"}`, false},
		{"nestedSource", "node_modules/@nestia/core/src/decorators/foreign/decorator", "node_modules/@nestia/core/src/decorators/foreign", `{"name":"foreign-child"}`, false},
		{"invalidManifest", "node_modules/@nestia/core/lib/broken/decorator", "node_modules/@nestia/core/lib/broken", "{", false},
		{"unnamedOwner", "node_modules/@nestia/core/lib/unnamed/decorator", "node_modules/@nestia/core/lib/unnamed", "{}", false},
		{"installedLib", "node_modules/@nestia/core/lib/decorator", "node_modules/@nestia/core", `{"name":"@nestia/core"}`, true},
		{"installedSource", "node_modules/@nestia/core/src/decorators/decorator", "node_modules/@nestia/core", `{"name":"@nestia/core"}`, true},
		{"relocated", "linked-core/custom/decorator", "linked-core", `{"name":"@nestia/core"}`, true},
	}
	var imports, calls strings.Builder
	want := map[string]bool{"reexported": true, "unresolved": false}
	for _, item := range cases {
		write(item.manifest+"/package.json", item.contents)
		write(item.location+".ts", "export declare function TypedBody(): unknown;\n")
		fmt.Fprintf(&imports, "import { TypedBody as %s } from %q;\n", item.binding, "./"+item.location)
		fmt.Fprintf(&calls, "%s();\n", item.binding)
		want[item.binding] = item.want
	}
	write("barrel.ts", `export { TypedBody } from "./linked-core/custom/decorator";`)
	imports.WriteString("import { TypedBody as reexported } from './barrel';\n")
	calls.WriteString("reexported();\nunresolved();\n")
	write("main.ts", imports.String()+calls.String())
	write("tsconfig.json", `{"compilerOptions":{"target":"ES2022","module":"commonjs","ignoreDeprecations":"6.0","noLib":true},"files":["main.ts"]}`)
	prog, diags, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	if len(diags) != 0 {
		t.Fatalf("configuration diagnostics: %v", diags)
	}
	source := prog.SourceFile(filepath.ToSlash(filepath.Join(root, "main.ts")))
	if source == nil {
		t.Fatal("main.ts not loaded")
	}
	seen := make(map[string]bool)
	var walk func(*shimast.Node)
	walk = func(node *shimast.Node) {
		if node.Kind == shimast.KindCallExpression {
			name := transform.NodeText(node.AsCallExpression().Expression)
			expected, exists := want[name]
			if !exists {
				t.Fatalf("unexpected call %q", name)
			}
			seen[name] = true
			if actual := transform.IsNestiaCoreCall(prog, node); actual != expected {
				t.Errorf("%s ownership = %v, want %v", name, actual, expected)
			}
		}
		node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
	}
	walk(source.AsNode())
	for name := range want {
		if !seen[name] {
			t.Errorf("call %s was not visited", name)
		}
	}
	if transform.IsNestiaCoreCall(nil, nil) || transform.SourceFilePackageName(nil, nil) != "" || transform.SourceFilePackageName(prog, nil) != "" {
		t.Error("absent program/source must not identify an owner")
	}
}
