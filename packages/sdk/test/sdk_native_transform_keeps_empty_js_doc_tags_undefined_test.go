package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Verifies an empty `@security` JSDoc tag is carried into the SDK metadata
// with no `text`, so the Swagger generator can emit an optional security
// requirement.
//
// The SDK transform is a linked contributor that injects metadata during the
// emit pass, so this exercises a `build` (not the bare `transform` subcommand,
// which prints rewritten source text and never runs the AST-level contributor).
//
//  1. Build SecurityController with both core and sdk plugins enabled.
//  2. Decode the injected OperationMetadata JSON literals.
//  3. Assert a bare `{"name":"security"}` tag survives next to a tagged one.
//
// @evidence contracts/testing.md#behavioral-verification Native build must encode an empty security tag without text while retaining text parts for its neighboring populated security tag.
// @evidence contracts/testing.md#independent-expectations Empty and populated JSDoc tags have different TypeScript meanings; omission of empty text permits optional security rather than inventing a scheme string.
// @evidence contracts/testing.md#distinguishing-cases The same emitted metadata includes a name-only and populated security tag, distinguishing omission from dropping all tags. Synthetic empty custom/param and margin tests cover other JSDoc forms.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKNativeTransformKeepsEmptyJSDocTagsUndefined(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk-e2e/features/security")
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
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/SecurityController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/**/*.ts"))+`"
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
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/SecurityController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	meta := extractOperationMetadataJSON(t, js)
	expected := `"jsDocTags":[{"name":"security"},{"name":"security","text":[`
	if !strings.Contains(meta, expected) {
		t.Fatalf("empty JSDoc tag should omit text so Swagger can emit optional security\n%s", meta)
	}
}
