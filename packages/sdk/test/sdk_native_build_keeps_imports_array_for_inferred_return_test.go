package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// @evidence contracts/testing.md#behavioral-verification Native build of an inferred-return controller must publish success.imports as an empty array rather than omitting it.
// @evidence contracts/testing.md#independent-expectations IOperationMetadata requires an imports array even when an anonymous inferred return has no named import; empty is a valid collection, not missing data.
// @evidence contracts/testing.md#distinguishing-cases This owns the zero-import boundary; named/local import build cases own populated import metadata and synthetic inferred-return cases own reflected shape.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKNativeBuildKeepsImportsArrayForInferredReturn(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk/features/clone-implicit")
	sourceRoot := filepath.Join(featureRoot, "src")
	typeRoots := nodeTypeRoots(t, root)
	if err := os.WriteFile(
		tsconfig,
		[]byte(`{
  "extends": "`+filepath.ToSlash(filepath.Join(featureRoot, "tsconfig.json"))+`",
  "compilerOptions": {
    "rootDir": "`+filepath.ToSlash(root)+`",
    "types": ["node"],
    "typeRoots": ["`+typeRoots+`"],
    "paths": {
      "@api": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api"))+`"],
      "@api/lib/*": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api/*"))+`"],
      "@nestia/core": ["`+filepath.ToSlash(filepath.Join(root, "packages/core/src"))+`"],
      "@nestia/core/*": ["`+filepath.ToSlash(filepath.Join(root, "packages/core/src/*"))+`"],
      "@nestia/sdk": ["`+filepath.ToSlash(filepath.Join(root, "packages/sdk/src"))+`"],
      "@nestia/sdk/*": ["`+filepath.ToSlash(filepath.Join(root, "packages/sdk/src/*"))+`"]
    }
  },
  "include": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/TypedBodyController.ts"))+`"
  ]
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	outDir := filepath.Join(temp, "lib")
	t.Setenv("TTSC_LINKED_PLUGINS_JSON", strings.TrimPrefix(sdkLinkedPluginsEnv, "TTSC_LINKED_PLUGINS_JSON="))
	runSDKNative(t, []string{
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	})
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TypedBodyController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	meta := extractOperationMetadataJSON(t, js)
	expected := `"success":{"imports":[]`
	if !strings.Contains(meta, expected) {
		t.Fatalf("inferred return metadata is missing imports array\n%s", meta)
	}
}
