package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// writeSyntheticTsconfig prepares TypeScript-language input for native SDK
// analysis. Authored source resolves repository declarations through explicit
// paths; no product consumer is built or executed. Library typings supply the
// checker's language model, and the test owns the temporary config/program.
func writeSyntheticTsconfig(t *testing.T, root, temp string) {
	t.Helper()
	typeRoots := nodeTypeRoots(t, root)
	body := `{
  "extends": "` + filepath.ToSlash(filepath.Join(root, "tests/config/tsconfig.json")) + `",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noUncheckedIndexedAccess": false,
    "rootDir": "` + filepath.ToSlash(temp) + `",
    "types": ["node"],
    "typeRoots": ["` + typeRoots + `"],
    "paths": {
      "@nestia/core": ["` + filepath.ToSlash(filepath.Join(root, "packages/core/src")) + `"],
      "@nestia/core/*": ["` + filepath.ToSlash(filepath.Join(root, "packages/core/src/*")) + `"],
      "@nestia/sdk": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/src")) + `"],
      "@nestia/sdk/*": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/src/*")) + `"],
      "tgrid": ["` + filepath.ToSlash(filepath.Join(root, "packages/core/node_modules/tgrid/lib/index.d.ts")) + `"],
      "typia": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/node_modules/typia/lib/index.d.ts")) + `"],
      "typia/*": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/node_modules/typia/lib/*")) + `"]
    }
  },
  "include": ["src"]
}`
	if err := os.WriteFile(filepath.Join(temp, "tsconfig.json"), []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

// buildSyntheticMetadata writes one controller .ts under temp/src/controllers,
// loads a program over it WITHOUT ForceEmit/outDir, then runs the SDK
// contributor's exported EmitTransform in-process and returns every injected
// OperationMetadata JSON joined by newlines. No JavaScript is ever written to
// disk, so the @nestia/* workspace sources stay untouched; the whole site /
// metadata / reflect pass still runs in this process, so -coverpkg attributes
// the executed branches to packages/sdk/native/sdk.
func buildSyntheticMetadata(t *testing.T, controller string) string {
	t.Helper()
	root := repoRoot(t)
	temp := t.TempDir()
	controllersDir := filepath.Join(temp, "src", "controllers")
	if err := os.MkdirAll(controllersDir, 0o755); err != nil {
		t.Fatal(err)
	}
	source := filepath.Join(controllersDir, "SyntheticController.ts")
	if err := os.WriteFile(source, []byte(controller), 0o644); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, root, temp)

	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load synthetic program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected synthetic load diagnostics: %v", diags)
	}
	defer prog.Close()

	return strings.Join(collectEmittedMetadata(t, prog), "\n")
}

// decodeSyntheticMetadata parses the single OperationMetadata JSON literal
// buildSyntheticMetadata returns for a one-method controller.
func decodeSyntheticMetadata(t *testing.T, literal string) map[string]any {
	t.Helper()
	output := map[string]any{}
	if err := json.Unmarshal([]byte(literal), &output); err != nil {
		t.Fatalf("decode metadata: %v\n%s", err, literal)
	}
	return output
}

// syntheticField reads one member of a decoded metadata object.
func syntheticField(t *testing.T, input any, name string) any {
	t.Helper()
	object, ok := input.(map[string]any)
	if !ok {
		t.Fatalf("expected an object holding %q, got %v", name, input)
	}
	value, ok := object[name]
	if !ok {
		t.Fatalf("metadata has no %q member: %v", name, object)
	}
	return value
}

// syntheticJsonSchema returns the baked `jsonSchema` of a parameter's or
// response's primitive or resolved schema pipe.
func syntheticJsonSchema(t *testing.T, response any, pipe string) map[string]any {
	t.Helper()
	data := syntheticField(t, syntheticField(t, response, pipe), "data")
	metadata := syntheticField(t, data, "metadata")
	baked, ok := syntheticField(t, metadata, "jsonSchema").(map[string]any)
	if !ok {
		t.Fatalf("%s schema has no baked jsonSchema", pipe)
	}
	return baked
}
