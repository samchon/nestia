package test

import (
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestMethodReturnTypeObservable verifies Observable<T> return types unwrap to
// their payload type.
//
// Locks NestJS Observable route support in the native return-type helper. The
// SDK and core transforms both consume this helper; if it treats Observable<T>
// as the response object itself, generated SDK clients lose the controller
// payload type and Swagger metadata points at the wrapper instead.
//
//  1. Load a temporary controller method returning Observable<{ foo: string }>.
//  2. Resolve the method's return type through NestiaCoreMethodReturnType.
//  3. Assert the resolved type is the payload rather than Observable<T>.
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
	if text == "Observable<{ foo: string; bar?: number | undefined; }>" {
		t.Fatalf("Observable wrapper was not unwrapped: %s", text)
	}
	if text == "Observable<{ foo: string; bar?: number; }>" {
		t.Fatalf("Observable wrapper was not unwrapped: %s", text)
	}
	if strings.Contains(text, "foo") == false {
		t.Fatalf("observable payload field was not preserved: %s", text)
	}
}
