package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Verifies the JSON literal injected via __OperationMetadata.OperationMetadata
// round-trips into the IOperationMetadata shape defined in
// packages/sdk/src/structures/IOperationMetadata.ts.
//
// Sibling tests only substring-match key fragments, so a Go-side field
// rename or removal would still pass them. This one parses the emitted
// literal as JSON and asserts every required top-level and parameter key
// is present — the only guard against silent SDK metadata drift.
//
//  1. Build TypedBodyController with both core and sdk plugins enabled.
//  2. Extract and json.Unmarshal the first OperationMetadata literal.
//  3. Assert required keys on the root, parameters, and success objects.
//
// @evidence contracts/testing.md#behavioral-verification The emitted decorator JSON must decode independently and retain required operation, parameter and success keys with parameter names as strings and exceptions as an array.
// @evidence contracts/testing.md#independent-expectations The test declares required keys from the TypeScript IOperationMetadata consumer protocol rather than decoding through the producer's Go struct.
// @evidence contracts/testing.md#distinguishing-cases Nonempty parameters prevent a vacuous field loop; parameter objects, names, success object and exception array are checked. Separate schema tests own values and absent optional fields.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKOperationMetadataShapeRoundTrip(t *testing.T) {
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
	literal, err := extractFirstOperationMetadataLiteral(js)
	if err != nil {
		t.Fatalf("could not locate __OperationMetadata literal: %v\n%s", err, js)
	}
	var meta map[string]any
	if err := json.Unmarshal(literal, &meta); err != nil {
		t.Fatalf("OperationMetadata literal is not valid JSON: %v\nliteral=%s", err, literal)
	}
	for _, key := range []string{"parameters", "success", "exceptions", "description", "jsDocTags"} {
		if _, ok := meta[key]; !ok {
			t.Fatalf("IOperationMetadata is missing required key %q\nmeta=%v", key, meta)
		}
	}
	parameters, ok := meta["parameters"].([]any)
	if !ok {
		t.Fatalf("expected parameters to be []any, got %T", meta["parameters"])
	}
	if len(parameters) == 0 {
		t.Fatal("expected at least one parameter in the TypedBodyController fixture")
	}
	for index, raw := range parameters {
		param, ok := raw.(map[string]any)
		if !ok {
			t.Fatalf("parameters[%d] is not an object: %T", index, raw)
		}
		for _, key := range []string{"name", "index", "description", "jsDocTags", "type", "imports", "primitive", "resolved"} {
			if _, ok := param[key]; !ok {
				t.Fatalf("parameters[%d] missing required key %q\nparam=%v", index, key, param)
			}
		}
		if _, ok := param["name"].(string); !ok {
			t.Fatalf("parameters[%d].name should be string, got %T", index, param["name"])
		}
	}
	success, ok := meta["success"].(map[string]any)
	if !ok {
		t.Fatalf("expected success to be an object, got %T", meta["success"])
	}
	for _, key := range []string{"type", "imports", "primitive", "resolved"} {
		if _, ok := success[key]; !ok {
			t.Fatalf("success missing required key %q\nsuccess=%v", key, success)
		}
	}
	if _, ok := meta["exceptions"].([]any); !ok {
		t.Fatalf("expected exceptions to be []any, got %T", meta["exceptions"])
	}
}
