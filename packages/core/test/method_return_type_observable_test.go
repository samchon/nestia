package test

import (
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestMethodReturnTypeObservable verifies local Observable<T> aliases do not
// unwrap as RxJS route payloads.
//
// Locks the guard around NestJS Observable route support in the native
// return-type helper. RxJS Observable<T> is an asynchronous NestJS response
// wrapper, but an unrelated user-defined type with the same name is just a
// normal DTO and must not be unwrapped by name alone.
//
//  1. Load a temporary controller method returning a local Observable<T> type.
//  2. Resolve the method's return type through NestiaCoreMethodReturnType.
//  3. Assert the resolved type remains the Observable wrapper.
func TestMethodReturnTypeObservable(t *testing.T) {
	temp := t.TempDir()
	writeFile(t, filepath.Join(temp, "tsconfig.json"), `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true
  },
  "include": ["controller.ts"]
}`)
	writeFile(t, filepath.Join(temp, "controller.ts"), `
type Observable<T> = { subscribe(): T };

class ReproController {
  public observable(): Observable<{ foo: string; bar?: number }> {
    return null as any;
  }
}
`)

	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
	if err != nil {
		t.Fatalf("LoadProgram failed: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("LoadProgram produced %d config diagnostics", len(diags))
	}
	defer prog.Close()

	source := prog.SourceFile(filepath.ToSlash(filepath.Join(temp, "controller.ts")))
	if source == nil {
		t.Fatal("controller.ts not in program")
	}

	var method *shimast.Node
	var walk func(node *shimast.Node)
	walk = func(node *shimast.Node) {
		if node == nil || method != nil {
			return
		}
		if node.Kind == shimast.KindMethodDeclaration && transform.NodeName(node) == "observable" {
			method = node
			return
		}
		node.ForEachChild(func(child *shimast.Node) bool {
			walk(child)
			return method != nil
		})
	}
	walk(source.AsNode())
	if method == nil {
		t.Fatal("observable method was not visited")
	}

	typ := transform.NestiaCoreMethodReturnType(prog, method)
	if typ == nil {
		t.Fatal("observable return type was not resolved")
	}
	text := prog.Checker.TypeToString(typ)
	if strings.Contains(text, "Observable") == false {
		t.Fatalf("local Observable wrapper was unexpectedly unwrapped: %s", text)
	}
}
