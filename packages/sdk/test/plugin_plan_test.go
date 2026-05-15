package test

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
)

func TestParsePlanDetectsSDKTransform(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"@nestia/sdk","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.SDK {
		t.Fatal("expected @nestia/sdk transform to be detected")
	}
	if plan.Core {
		t.Fatal("did not expect @nestia/core transform")
	}
	if !plan.UsesNestia() {
		t.Fatal("expected SDK transform to count as a Nestia transform")
	}
}

func TestCoreAndSDKTransformsShareHostContract(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"@nestia/core","config":{"transform":"@nestia/core/lib/transform"}},
		{"name":"@nestia/sdk","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.Core || !plan.SDK {
		t.Fatal("expected core and sdk transforms to be co-hosted")
	}
}

func TestSDKNativeBuildInjectsOperationMetadata(t *testing.T) {
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
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
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
		`core_1.default.TypedBody(({`,
		`"name":"IBbsArticle.IUpdate"`,
		`"elements":["IBbsArticle"]`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("emitted JavaScript is missing %q\n%s", expected, text)
		}
	}
}

func TestSDKNativeBuildInjectsTypedExceptionMetadata(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk/features/exception")
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
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/ExceptionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	for _, expected := range []string{
		`"exceptions":[`,
		`"name":"TypeGuardError"`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
		`"name":"throws"`,
		`"text":"400 invalid request"`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("emitted JavaScript is missing %q\n%s", expected, text)
		}
	}
}

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
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TypedBodyController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	expected := `"success":{"imports":[]`
	if !strings.Contains(text, expected) {
		t.Fatalf("inferred return metadata is missing imports array\n%s", text)
	}
}

func TestSDKNativeTransformKeepsEmptyJSDocTagsUndefined(t *testing.T) {
	root := repoRoot(t)
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", filepath.Join(root, "tests/test-sdk"),
		"--tsconfig", "features/security/tsconfig.json",
		"--file", filepath.Join(root, "tests/test-sdk/features/security/src/controllers/SecurityController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	expected := `"jsDocTags":[{"name":"security"},{"name":"security","text":[`
	if !strings.Contains(text, expected) {
		t.Fatalf("empty JSDoc tag should omit text so Swagger can emit optional security\n%s", text)
	}
}

// TestSDKOperationMetadataShapeRoundTrip locks the JSON shape that the Go
// transformer injects via __OperationMetadata.OperationMetadata(...). The
// surrounding tests only substring-match key fragments, so a Go-side field
// rename or removal would still pass them. Here we extract one literal,
// json.Unmarshal it, and assert against packages/sdk/src/structures/
// IOperationMetadata.ts.
func TestSDKOperationMetadataShapeRoundTrip(t *testing.T) {
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
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
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

// extractFirstOperationMetadataLiteral scans the emitted JS for the first
// __OperationMetadata.OperationMetadata( call and returns the inner JSON
// object literal (everything between the matching `{` and `}`). The
// transformer emits valid JSON via json.Marshal (see
// nestiaSDKMetadataLiteralText in packages/core/native/cmd/ttsc-nestia/
// sdk_transform.go), so the slice can be fed directly to json.Unmarshal.
func extractFirstOperationMetadataLiteral(js []byte) ([]byte, error) {
	const needle = "__OperationMetadata.OperationMetadata("
	idx := bytes.Index(js, []byte(needle))
	if idx < 0 {
		return nil, &literalError{msg: "OperationMetadata call not found"}
	}
	start := idx + len(needle)
	for start < len(js) && js[start] != '{' {
		start++
	}
	if start >= len(js) {
		return nil, &literalError{msg: "no opening brace after OperationMetadata("}
	}
	depth := 0
	inString := false
	escape := false
	for i := start; i < len(js); i++ {
		c := js[i]
		if escape {
			escape = false
			continue
		}
		if inString {
			switch c {
			case '\\':
				escape = true
			case '"':
				inString = false
			}
			continue
		}
		switch c {
		case '"':
			inString = true
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return js[start : i+1], nil
			}
		}
	}
	return nil, &literalError{msg: "unterminated OperationMetadata literal"}
}

type literalError struct{ msg string }

func (e *literalError) Error() string { return e.msg }

func TestSDKNativeBuildImportsLocalTypeAliases(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk/features/tags")
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
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TransactionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	for _, expected := range []string{
		`"PubkeyInput"`,
		`TransactionController`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("local type alias import metadata is missing %q\n%s", expected, text)
		}
	}
}

func repoRoot(t *testing.T) string {
	t.Helper()
	root, err := filepath.Abs("../../..")
	if err != nil {
		t.Fatal(err)
	}
	return root
}

func nodeTypeRoots(t *testing.T, root string) string {
	t.Helper()
	candidates := []string{
		filepath.Join(root, "node_modules/@types"),
	}
	matches, err := filepath.Glob(filepath.Join(root, "node_modules/.pnpm/@types+node@*/node_modules/@types"))
	if err != nil {
		t.Fatal(err)
	}
	candidates = append(candidates, matches...)
	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(candidate, "node")); err == nil {
			return filepath.ToSlash(candidate)
		}
	}
	t.Fatal("unable to locate @types/node")
	return ""
}

func emittedJSPath(t *testing.T, root string, outDir string, source string) string {
	t.Helper()
	rel, err := filepath.Rel(root, source)
	if err != nil {
		t.Fatal(err)
	}
	return filepath.Join(outDir, strings.TrimSuffix(rel, filepath.Ext(rel))+".js")
}
