package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSDKNativeBuildImportsLocalTypeAliases verifies a native build records the
// local exported type alias of a transaction operation in the imports of its
// metadata.
//
// The generated SDK imports each parameter and response type from its declaring
// file, so an alias declared beside the controller must be listed with its
// source file.
//
//  1. Build TransactionController with the core and sdk plugins in-process.
//  2. Decode the injected OperationMetadata literals.
//  3. Assert an operation's parameter or success imports list PubkeyInput.
//
// @evidence contracts/testing.md#behavioral-verification Native build must emit the transaction controller and list PubkeyInput in a decoded parameter or success imports entry of its operation metadata for its local exported type alias, so the name appearing only as a schema or property cannot satisfy it.
// @evidence contracts/testing.md#independent-expectations The authored transaction signature names PubkeyInput from its local alias declaration; generated import metadata must preserve that usable source identity.
// @evidence contracts/testing.md#distinguishing-cases This owns local alias import collection in emitted JavaScript; native import-alias and synthetic nested reflection cases own other alias forms. It checks presence rather than every import association.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKNativeBuildImportsLocalTypeAliases(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk-e2e/features/tags")
	sourceRoot := filepath.Join(featureRoot, "src")
	if err := os.WriteFile(
		tsconfig,
		[]byte(`{
  "extends": "`+filepath.ToSlash(filepath.Join(featureRoot, "tsconfig.json"))+`",
  "compilerOptions": {
    "rootDir": "`+filepath.ToSlash(root)+`",
    "paths": {
      "@api": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api"))+`"],
      "@api/lib/*": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api/*"))+`"]
    }
  },
  "include": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/TransactionController.ts"))+`"
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
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TransactionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	if text := string(js); !strings.Contains(text, `TransactionController`) {
		t.Fatalf("emitted JavaScript is missing the controller class\n%s", text)
	}
	found := false
	for _, name := range operationImportElements(t, js) {
		found = found || name == "PubkeyInput"
	}
	if !found {
		t.Fatalf("the parameter and success imports of the operation metadata do not name PubkeyInput\n%s", extractOperationMetadataJSON(t, js))
	}
}
