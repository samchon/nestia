package test

import (
	"os"
	"os/exec"
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
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), "NESTIA_SDK_TRANSFORM=1")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TypedBodyController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	for _, expected := range []string{
		`const __OperationMetadata = require("@nestia/sdk");`,
		`__OperationMetadata.OperationMetadata(`,
		`core_1.default.TypedRoute.Put(":id", ({`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("emitted JavaScript is missing %q\n%s", expected, text)
		}
	}
}
