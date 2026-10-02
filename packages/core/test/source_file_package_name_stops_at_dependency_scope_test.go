package test

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestSourceFilePackageNameStopsAtDependencyScope verifies declaration ownership
// cannot leak from an enclosing package through a dependency scope boundary.
//
// Node's LOOKUP_PACKAGE_SCOPE stops at node_modules. A dependency without its
// own manifest therefore does not belong to the core package that installed it,
// even when TypeScript successfully resolves its declaration by relative path.
//
//  1. Contrast ordinary children and nested dependencies for four real owners.
//  2. Vary the dependency manifest: missing, foreign, core, malformed or unnamed.
//  3. Reject a manifest on the node_modules boundary itself before reading it.
//  4. Require direct package names and actual call ownership for every source.
//
// @evidence contracts/testing.md#behavioral-verification SourceFilePackageName must preserve core/rxjs/tgrid/typia ownership for ordinary children, reject inheritance across node_modules, reject a manifest on that boundary and malformed/unnamed leaf manifests, and preserve valid foreign/core leaf ownership. IsNestiaCoreCall applies each expected core verdict to an actual resolved signature.
// @evidence contracts/testing.md#independent-expectations Node's documented LOOKUP_PACKAGE_SCOPE stops before crossing node_modules, and the authored nearest manifests fix foreign versus core identity. The missing manifest cannot confer the outer core name on a different dependency.
// @evidence contracts/testing.md#distinguishing-cases The original missing/foreign/core twins retain identical nested paths and declarations while changing only the leaf manifest. Ordinary-child and nested-child pairs change only the scope path for each consumer owner. Boundary-manifest, malformed and unnamed controls prevent delayed termination or fallthrough; actual signature source checks prevent unresolved-call false positives.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and loads each small authored checker program in-process, closing it after direct operation calls. No native artifact, product compilation, installation or runtime process is prepared.
func TestSourceFilePackageNameStopsAtDependencyScope(t *testing.T) {
	for _, item := range []struct {
		name, outer, manifest, owner   string
		nested, boundaryManifest, core bool
	}{
		{"missing-core", "@nestia/core", "", "", true, false, false},
		{"missing-rxjs", "rxjs", "", "", true, false, false},
		{"missing-tgrid", "tgrid", "", "", true, false, false},
		{"missing-typia", "typia", "", "", true, false, false},
		{"ordinary-core", "@nestia/core", "", "@nestia/core", false, false, true},
		{"ordinary-rxjs", "rxjs", "", "rxjs", false, false, false},
		{"ordinary-tgrid", "tgrid", "", "tgrid", false, false, false},
		{"ordinary-typia", "typia", "", "typia", false, false, false},
		{"foreign", "@nestia/core", `{"name":"foreign-dependency"}`, "foreign-dependency", true, false, false},
		{"core", "@nestia/core", `{"name":"@nestia/core"}`, "@nestia/core", true, false, true},
		{"malformed", "@nestia/core", `{`, "", true, false, false},
		{"unnamed", "@nestia/core", `{}`, "", true, false, false},
		{"boundary-manifest", "@nestia/core", "", "", true, true, false},
	} {
		t.Run(item.name, func(t *testing.T) {
			root := t.TempDir()
			outer := filepath.Join(root, "node_modules", "@nestia", "core")
			dependency := filepath.Join(outer, "lib", "internal")
			if item.nested {
				dependency = filepath.Join(outer, "node_modules", "dependency")
			}
			if err := os.MkdirAll(dependency, 0o755); err != nil {
				t.Fatal(err)
			}
			writeFile(t, filepath.Join(outer, "package.json"), fmt.Sprintf(`{"name":%q}`, item.outer))
			if item.boundaryManifest {
				writeFile(t, filepath.Join(outer, "node_modules", "package.json"), `{"name":"@nestia/core"}`)
			}
			if item.manifest != "" {
				writeFile(t, filepath.Join(dependency, "package.json"), item.manifest)
			}
			declarationPath := filepath.Join(dependency, "index.d.ts")
			writeFile(t, declarationPath, `export declare function TypedBody(): unknown;`)
			relative, err := filepath.Rel(root, dependency)
			if err != nil {
				t.Fatal(err)
			}
			writeFile(t, filepath.Join(root, "main.ts"), fmt.Sprintf("import { TypedBody } from %q;\nTypedBody();", "./"+filepath.ToSlash(relative)))
			writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"module":"commonjs","noLib":true,"strict":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
			prog, diagnostics, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
			if err != nil {
				t.Fatal(err)
			}
			defer prog.Close()
			if len(diagnostics) != 0 {
				t.Fatalf("configuration diagnostics: %v", diagnostics)
			}
			file := prog.SourceFile(filepath.ToSlash(filepath.Join(root, "main.ts")))
			if file == nil {
				t.Fatal("authored caller not loaded")
			}
			found := false
			var walk func(*shimast.Node)
			walk = func(node *shimast.Node) {
				if node.Kind == shimast.KindCallExpression {
					signature := prog.Checker.GetResolvedSignature(node)
					if signature == nil || signature.Declaration() == nil {
						t.Fatal("authored dependency call did not resolve")
					}
					source := shimast.GetSourceFileOfNode(signature.Declaration())
					if source == nil || filepath.Clean(source.FileName()) != filepath.Clean(declarationPath) {
						t.Fatal("call did not resolve to the authored nested dependency")
					}
					if got := transform.SourceFilePackageName(prog, source); got != item.owner {
						t.Errorf("declaration owner = %q, want %q", got, item.owner)
					}
					if got := transform.IsNestiaCoreCall(prog, node); got != item.core {
						t.Errorf("core call = %v, want %v", got, item.core)
					}
					found = true
				}
				node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
			}
			walk(file.AsNode())
			if !found {
				t.Fatal("authored dependency call not visited")
			}
		})
	}
}
