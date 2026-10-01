package test

import (
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestMethodReturnTypePromiseDeclaringLibrary verifies asynchronous response
// analysis distinguishes the library Promise from user wrappers.
//
// A namespace, import alias or misleading library filename does not make an
// ordinary value container asynchronous. Global augmentation merges with the
// actual library declaration and must retain native Promise recognition.
//
//  1. Load authored native, namespace and imported wrapper returns together.
//  2. Require each resolved payload or preserved wrapper and reference verdict.
//  3. Repeat with no standard library and a user global Promise declaration.
//
// @evidence contracts/testing.md#behavioral-verification NestiaCoreMethodReturnType unwraps actual library Promise and an alias to it, preserves namespace/imported/re-exported user Promise and PromiseLike, and keeps a user global Promise when no library is loaded. The exported reference predicate must agree with resolved declaration provenance for direct and imported references.
// @evidence contracts/testing.md#independent-expectations Authored user wrappers contain value without a then method and therefore are ordinary objects; library Promise is the supported asynchronous wrapper. Native declarations remain present after global augmentation, while a file named lib.es2015.promise.d.ts is just an authored module unless the compiler identifies it as a library.
// @evidence contracts/testing.md#distinguishing-cases Native, globalThis-qualified, nested and inferred async returns contrast namespace, imported and re-exported user Promise, PromiseLike, a misleading lib filename, global augmentation, absent library and unresolved references. The nested core return intentionally unwraps one layer; SDK recursive reflection owns complete nested unwrapping.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit Test, loads two authored checker programs in-process, and closes each program. No JavaScript product, installed consumer, native host or runtime process is built or launched.
func TestMethodReturnTypePromiseDeclaringLibrary(t *testing.T) {
	for _, noLibrary := range []bool{false, true} {
		name := "library-and-augmentation"
		if noLibrary {
			name = "authored-global-without-library"
		}
		t.Run(name, func(t *testing.T) {
			root := t.TempDir()
			writeFile(t, filepath.Join(root, "lib.es2015.promise.d.ts"), `export interface Promise<T> { value: T; }`)
			writeFile(t, filepath.Join(root, "barrel.ts"), `export { Promise as Reexported } from "./lib.es2015.promise";`)
			writeFile(t, filepath.Join(root, "shadow.ts"), `export interface Promise<T> { value: T; }
export class ShadowController { public bare(): Promise<{ bare: string }> { return null!; } }`)
			source := `import { Promise as Imported } from "./lib.es2015.promise";
import { Reexported } from "./barrel";
export namespace Foreign { export interface Promise<T> { value: T; } }
export interface PromiseLike<T> { value: T; }
type Alias<T> = Promise<T>;
declare global { interface Promise<T> { marker?: T; } }
export class Controller {
  public native(): Promise<{ native: string }> { return null!; }
  public qualified(): globalThis.Promise<{ qualified: string }> { return null!; }
  public nested(): Promise<Promise<{ nested: string }>> { return null!; }
  public aliased(): Alias<{ aliased: string }> { return null!; }
  public async inferred() { return { inferred: true }; }
  public foreign(): Foreign.Promise<{ foreign: string }> { return null!; }
  public imported(): Imported<{ imported: string }> { return null!; }
  public reexported(): Reexported<{ reexported: string }> { return null!; }
  public promiseLike(): PromiseLike<{ promiseLike: string }> { return null!; }
  public unresolved(): Missing<{ unresolved: string }> { return null!; }
}`
			want := map[string]struct {
				payload, wrapper string
				reference        bool
			}{
				"native": {"native", "", true}, "qualified": {"qualified", "", true},
				"nested": {"nested", "Promise", true}, "aliased": {"aliased", "", false},
				"inferred": {"inferred", "", false}, "foreign": {"foreign", "Promise", false},
				"imported": {"imported", "Promise", false}, "reexported": {"reexported", "Promise", false},
				"promiseLike": {"promiseLike", "PromiseLike", false},
				"bare":        {"bare", "Promise", false},
			}
			config := `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"ignoreDeprecations":"6.0"},"files":["main.ts","shadow.ts"]}`
			if noLibrary {
				source = `interface Promise<T> { value: T; }
class Controller { public local(): Promise<{ local: string }> { return null!; } }`
				want = map[string]struct {
					payload, wrapper string
					reference        bool
				}{"local": {"local", "Promise", false}}
				config = `{"compilerOptions":{"noLib":true,"module":"commonjs","strict":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`
			}
			writeFile(t, filepath.Join(root, "main.ts"), source)
			writeFile(t, filepath.Join(root, "tsconfig.json"), config)
			prog, diags, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
			if err != nil {
				t.Fatal(err)
			}
			defer prog.Close()
			if len(diags) != 0 {
				t.Fatalf("configuration diagnostics: %v", diags)
			}
			file := prog.SourceFile(filepath.ToSlash(filepath.Join(root, "main.ts")))
			if file == nil {
				t.Fatal("source not loaded")
			}
			seen := map[string]bool{}
			var walk func(*shimast.Node)
			walk = func(node *shimast.Node) {
				if node.Kind == shimast.KindMethodDeclaration {
					method := transform.NodeName(node)
					typeNode := node.FunctionLikeData().Type
					if method == "unresolved" {
						if transform.NestiaCoreIsAsyncReturnWrapperReference(prog, typeNode.AsTypeReferenceNode().TypeName) {
							t.Error("unresolved wrapper accepted")
						}
					} else if expected, ok := want[method]; ok {
						seen[method] = true
						typ := transform.NestiaCoreMethodReturnType(prog, node)
						if typ == nil {
							t.Fatalf("%s missing return type", method)
						}
						text := prog.Checker.TypeToString(typ)
						if !strings.Contains(text, expected.payload) || (expected.wrapper == "" && strings.Contains(text, "Promise")) || (expected.wrapper != "" && !strings.Contains(text, expected.wrapper)) {
							t.Errorf("%s return = %s, want payload %s wrapper %q", method, text, expected.payload, expected.wrapper)
						}
						if typeNode != nil && typeNode.Kind == shimast.KindTypeReference {
							actual := transform.NestiaCoreIsAsyncReturnWrapperReference(prog, typeNode.AsTypeReferenceNode().TypeName)
							if actual != expected.reference {
								t.Errorf("%s wrapper reference = %v, want %v", method, actual, expected.reference)
							}
						}
					}
				}
				node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
			}
			walk(file.AsNode())
			if !noLibrary {
				shadow := prog.SourceFile(filepath.ToSlash(filepath.Join(root, "shadow.ts")))
				if shadow == nil {
					t.Fatal("shadow source not loaded")
				}
				walk(shadow.AsNode())
			}
			for method := range want {
				if !seen[method] {
					t.Errorf("%s not visited", method)
				}
			}
			if transform.NestiaCoreIsAsyncReturnWrapperReference(nil, file.AsNode()) || transform.NestiaCoreIsAsyncReturnWrapperReference(prog, nil) {
				t.Error("absent checker/reference accepted")
			}
		})
	}
}
