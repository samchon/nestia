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

// TestMethodReturnTypeInlinePromise verifies inline and generic Promise return
// types unwrap to their payload type without crashing return-type analysis, and
// a plain or non-Promise return keeps its own type.
//
// Locks the native replacement for the old TypeScript MethodTransformer branch
// reported in #1382. Inline object literals and generic envelopes can expose
// synthesized symbols, so the helper must unwrap Promise<T> only when the type
// argument is available and otherwise fall back without dereferencing missing
// declarations.
//
//  1. Load a temporary program with inline and generic Promise return types.
//  2. Visit both method declarations.
//  3. Assert NestiaCoreMethodReturnType returns the unwrapped payload type for each
//     Promise method, and the own type for a plain string and a non-Promise
//     method, without panicking.
//
// @evidence contracts/testing.md#behavioral-verification Inline-object, generic-envelope and plain Promise methods must be visited and yield the unwrapped payload, never text containing Promise, and a non-Promise method must keep its own type, without panicking.
// @evidence contracts/testing.md#independent-expectations The fixture explicitly declares each return type, and TypeScript semantics fix that Promise<T> awaits to T; the expected prefixes are literals written from the declarations, independent of generated schemas.
// @evidence contracts/testing.md#distinguishing-cases Inline object and generic envelope spellings own the synthesized-symbol crash distinction; the assertions compare the leading payload text, not every printed member, and the plain string case is compared exactly.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers the case and loads an isolated source program in-process; traversal records both method names and defer closes the driver program.
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

  public async plain(): Promise<string> {
    return "ok";
  }

  public direct(): { foo: string } {
    return { foo: "ok" };
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

	// The payload each method must resolve to: Promise<T> unwraps to T, and a
	// method that is not a Promise keeps its own type.
	expected := map[string]string{
		"inline":   "{ foo: string;",
		"envelope": "Envelope<{ foo: string;",
		"plain":    "string",
		"direct":   "{ foo: string;",
	}
	seen := map[string]bool{}
	var walk func(node *shimast.Node)
	walk = func(node *shimast.Node) {
		if node == nil {
			return
		}
		if node.Kind == shimast.KindMethodDeclaration {
			name := transform.NodeName(node)
			if prefix, ok := expected[name]; ok {
				typ := transform.NestiaCoreMethodReturnType(prog, node)
				if typ == nil {
					t.Fatalf("%s return type was not resolved", name)
				}
				text := prog.Checker.TypeToString(typ)
				if strings.Contains(text, "Promise") || !strings.HasPrefix(text, prefix) || (name == "plain" && text != "string") {
					t.Fatalf("%s resolved to %q, want the unwrapped payload %q", name, text, prefix)
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

	for name := range expected {
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
