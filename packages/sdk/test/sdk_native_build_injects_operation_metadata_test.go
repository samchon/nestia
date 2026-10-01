package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSDKNativeBuildInjectsOperationMetadata verifies a native build with both
// the core and sdk plugins emits the SDK metadata decorator and the core
// validators together.
//
// The two passes share one emit, so the SDK namespace import and metadata call
// must coexist with the core route and body validators and carry the named DTO
// types of the operation.
//
//  1. Build TypedBodyController with the core and sdk plugins in-process.
//  2. Assert the emitted JavaScript holds the SDK import, the metadata call and
//     the core route and body decorators.
//  3. Assert the decoded metadata names IBbsArticle.IUpdate and imports
//     IBbsArticle.
//
// @evidence contracts/testing.md#behavioral-verification Native build must emit SDK namespace/imported metadata calls alongside core route/body validators and preserve IBbsArticle.IUpdate and IBbsArticle type metadata.
// @evidence contracts/testing.md#independent-expectations The authored controller route, body and DTO types independently require these transformations; generated SDK metadata must coexist with the core validator pass.
// @evidence contracts/testing.md#distinguishing-cases This owns combined core/SDK JavaScript emission and named DTO information. The shape-round-trip case validates required metadata fields, while gate-off/no-site cases own absent contributor output.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKNativeBuildInjectsOperationMetadata(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	sourceRoot := filepath.Join(root, "tests/test-sdk-e2e/features/body/src")
	typeRoots := nodeTypeRoots(t, root)
	if err := os.WriteFile(
		tsconfig,
		[]byte(`{
  "extends": "`+filepath.ToSlash(filepath.Join(root, "tests/test-sdk-e2e/features/body/tsconfig.json"))+`",
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
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/TypedBodyController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IBbsArticle.ts"))+`"
  ],
  "include": []
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
	text := string(js)
	// The SDK contributor injects the namespace import and the
	// OperationMetadata decorator as synthesized AST nodes; the emitter prints
	// the `import * as` namespace import in the esModuleInterop `__importStar`
	// form.
	for _, expected := range []string{
		`const __OperationMetadata = __importStar(require("@nestia/sdk"));`,
		`__OperationMetadata.OperationMetadata(`,
		`core_1.default.TypedRoute.Put(":id", {`,
		`core_1.default.TypedBody({`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("emitted JavaScript is missing %q\n%s", expected, text)
		}
	}
	// The metadata rides in a single JSON string literal that the decorator
	// JSON.parses at runtime; decode it back to the raw metadata JSON.
	meta := extractOperationMetadataJSON(t, js)
	for _, expected := range []string{
		`"name":"IBbsArticle.IUpdate"`,
		`"elements":["IBbsArticle"]`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("OperationMetadata JSON is missing %q\n%s", expected, meta)
		}
	}
}
