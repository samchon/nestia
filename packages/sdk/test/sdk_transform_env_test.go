package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

/**
 * Verifies NESTIA_SDK_TRANSFORM activates metadata injection without a
 * top-level SDK plugin entry.
 *
 * The nestia CLI materializes user code with only the aggregate core native
 * host in compilerOptions.plugins. The SDK package is statically linked as a
 * core contributor, so the host must run the SDK rewrite pass from the explicit
 * runtime env instead of relying on TTSC_LINKED_PLUGINS_JSON entries.
 *
 * 1. Compile a controller through the SDK test host with only @nestia/core in
 *    --plugins-json.
 * 2. Enable NESTIA_SDK_TRANSFORM for that compile.
 * 3. Assert the emitted JavaScript contains the OperationMetadata decorator.
 */
//
// @evidence contracts/testing.md#behavioral-verification A native build with core-only plugins and SDK runtime opt-in must emit the SDK import and OperationMetadata while preserving the core Put route validator.
// @evidence contracts/testing.md#independent-expectations The core host links the SDK contributor and honors the runtime environment opt-in; the controller's authored route must also receive its ordinary core transformation.
// @evidence contracts/testing.md#distinguishing-cases This owns JavaScript build propagation; the TypeScript activation/gate-off pair distinguishes enabled and disabled states before emit. It does not start an installed CLI process.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKTransformEnvActivatesContributorMetadata(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	sourceRoot := filepath.Join(root, "tests/test-sdk/features/body/src")
	typeRoots := nodeTypeRoots(t, root)
	if err := os.WriteFile(
		tsconfig,
		[]byte(`{
  "extends": "`+filepath.ToSlash(filepath.Join(root, "tests/test-sdk/features/body/tsconfig.json"))+`",
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
	t.Setenv("NESTIA_SDK_TRANSFORM", "1")
	runSDKNative(t, []string{
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	})
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TypedBodyController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	// AST-integration emit: the contributor injects a namespace import whose
	// alias tsgo's module-transform generates (so the binding name is not the
	// legacy fixed `__OperationMetadata`), and the decorator argument is no longer
	// wrapped in the extra text-splice parentheses.
	for _, expected := range []string{
		`__importStar(require("@nestia/sdk"))`,
		`.OperationMetadata(`,
		`core_1.default.TypedRoute.Put(":id", {`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("emitted JavaScript is missing %q\n%s", expected, text)
		}
	}
}
