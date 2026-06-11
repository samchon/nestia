package test

import (
	"os"
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestMethodReturnTypeInlinePromise verifies inline and generic Promise return
// types do not crash return-type analysis.
//
// Locks the native replacement for the old TypeScript MethodTransformer branch
// reported in #1382. Inline object literals and generic envelopes can expose
// synthesized symbols, so the helper must unwrap Promise<T> only when the type
// argument is available and otherwise fall back without dereferencing missing
// declarations.
//
//  1. Load a temporary program with inline and generic Promise return types.
//  2. Visit both method declarations.
//  3. Assert NestiaCoreMethodReturnType returns a type for each method without
//     panicking.
func TestMethodReturnTypeInlinePromise(t *testing.T) {
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
type Envelope<T> = { message: string; data: T | null };

class ReproController {
  public async inline(): Promise<{ foo: string; bar?: number }> {
    return { foo: "ok" };
  }

  public async envelope(): Promise<Envelope<{ foo: string; bar?: number }>> {
    return { message: "ok", data: { foo: "ok" } };
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

	seen := map[string]bool{}
	var walk func(node *shimast.Node)
	walk = func(node *shimast.Node) {
		if node == nil {
			return
		}
		if node.Kind == shimast.KindMethodDeclaration {
			name := transform.NodeName(node)
			if name == "inline" || name == "envelope" {
				if typ := transform.NestiaCoreMethodReturnType(prog, node); typ == nil {
					t.Fatalf("%s return type was not resolved", name)
				}
				seen[name] = true
			}
		}
		node.ForEachChild(func(child *shimast.Node) bool {
			walk(child)
			return false
		})
	}
	walk(source.AsNode())

	for _, name := range []string{"inline", "envelope"} {
		if !seen[name] {
			t.Fatalf("%s method was not visited", name)
		}
	}
}

func writeFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("failed to write %s: %v", path, err)
	}
}
