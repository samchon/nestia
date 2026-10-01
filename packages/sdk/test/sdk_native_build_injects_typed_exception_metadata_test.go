package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSDKNativeBuildInjectsTypedExceptionMetadata verifies a native build records
// the authored typed exceptions of a controller in the exceptions of its
// operation metadata, and the @throws description beside them.
//
// The Swagger generator reads exceptions from this metadata, so an exception
// type present only in a parameter or response would not reach it.
//
//  1. Build ExceptionController with the core and sdk plugins in-process.
//  2. Decode the injected OperationMetadata literals.
//  3. Assert the exceptions entries name the TypeGuardError and the three
//     authored error types, and the throws tag keeps its text.
//
// @evidence contracts/testing.md#behavioral-verification Native build must retain, within the decoded exceptions entries, TypeGuardError and all three authored named error types, and the throws description in the metadata, so a name that appears only outside the exceptions cannot satisfy it.
// @evidence contracts/testing.md#independent-expectations The handwritten TypedException declarations and JSDoc specify the exception identities and 400 invalid request text independently of emitted JSON.
// @evidence contracts/testing.md#distinguishing-cases This pins exception preservation through JavaScript emit; the in-process metadata case additionally checks union constituents and guard schema fields. Presence assertions alone do not pin every status association.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKNativeBuildInjectsTypedExceptionMetadata(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk-e2e/features/exception")
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
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/ExceptionController.ts"))+`",
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
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/ExceptionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	exceptions := operationExceptionsJSON(t, js)
	for _, expected := range []string{
		`"name":"TypeGuardError`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
	} {
		if !strings.Contains(exceptions, expected) {
			t.Fatalf("the exceptions of the OperationMetadata JSON are missing %q\n%s", expected, exceptions)
		}
	}
	meta := extractOperationMetadataJSON(t, js)
	for _, expected := range []string{`"name":"throws"`, `"text":"400 invalid request"`} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("OperationMetadata JSON is missing %q\n%s", expected, meta)
		}
	}
}
