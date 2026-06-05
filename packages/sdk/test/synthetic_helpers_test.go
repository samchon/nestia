package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// writeSyntheticTsconfig writes a tsconfig in temp whose rootDir is temp itself,
// so a self-authored controller under temp/src loads against the repo sources
// without touching the tests/test-sdk fixtures. It pins @nestia/core,
// @nestia/sdk, typia and @types/node to the repository sources through `paths`
// and `typeRoots`, the same wiring writeFeatureTsconfig uses, so the in-process
// load resolves the linked SDK contributor the same way a real nestia build
// does.
//
// Synthetic controllers exist because the existing tests/test-sdk fixtures carry
// no controller whose return/parameter type annotation is a `Record<...>`,
// `keyof`, `readonly`, `typeof`, or a bare intersection — the reflect-type
// switch in sdk_transform.go has a branch per AST shape, and only a fixture that
// writes those exact annotations drives the matching branch in-process.
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
      "typia": ["` + filepath.ToSlash(filepath.Join(root, "tests/test-sdk/node_modules/typia/lib/index.d.ts")) + `"],
      "typia/*": ["` + filepath.ToSlash(filepath.Join(root, "tests/test-sdk/node_modules/typia/lib/*")) + `"]
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
