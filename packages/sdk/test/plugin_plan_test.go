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

// sdkLinkedPluginsEnv tells the ttsc driver that one linked plugin — the SDK
// contributor — is present, so it invokes the plugin the blank import in
// cmd/ttsc-nestia-sdk registers. ttsc sets this env for real contributor
// builds; the test-support host reproduces it.
const sdkLinkedPluginsEnv = `TTSC_LINKED_PLUGINS_JSON=[{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`

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
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
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
		`core_1.default.TypedRoute.Put(":id", ({`,
		`core_1.default.TypedBody(({`,
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
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/ExceptionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	meta := extractOperationMetadataJSON(t, js)
	for _, expected := range []string{
		`"exceptions":[`,
		`"name":"TypeGuardError"`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
		`"name":"throws"`,
		`"text":"400 invalid request"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("OperationMetadata JSON is missing %q\n%s", expected, meta)
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
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
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
func TestSDKNativeTransformKeepsEmptyJSDocTagsUndefined(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	tsconfig := filepath.Join(temp, "tsconfig.json")
	featureRoot := filepath.Join(root, "tests/test-sdk/features/security")
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
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
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
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
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

// extractAllOperationMetadataLiterals scans build output for every
// __OperationMetadata.OperationMetadata("<json>") call and returns the decoded
// metadata JSON of each.
//
// The SDK contributor injects metadata as one JSON string literal that the
// OperationMetadata decorator JSON.parses at runtime (see
// packages/sdk/native/sdk/register.go). The emitter prints that argument as a
// double-quoted JS string literal — itself a valid JSON string — so a single
// json.Unmarshal pass unescapes it back to the raw metadata JSON that
// json.Marshal produced in packages/sdk/native/sdk/sdk_metadata_json.go.
func extractAllOperationMetadataLiterals(data []byte) ([][]byte, error) {
	const needle = "__OperationMetadata.OperationMetadata("
	var literals [][]byte
	for rest := data; ; {
		idx := bytes.Index(rest, []byte(needle))
		if idx < 0 {
			break
		}
		rest = rest[idx+len(needle):]
		start := 0
		for start < len(rest) && (rest[start] == ' ' || rest[start] == '\t' || rest[start] == '\n' || rest[start] == '\r') {
			start++
		}
		if start >= len(rest) || rest[start] != '"' {
			return nil, &literalError{msg: "OperationMetadata argument is not a string literal"}
		}
		end := start + 1
		for end < len(rest) && rest[end] != '"' {
			if rest[end] == '\\' {
				end++
			}
			end++
		}
		if end >= len(rest) {
			return nil, &literalError{msg: "unterminated OperationMetadata string literal"}
		}
		var inner string
		if err := json.Unmarshal(rest[start:end+1], &inner); err != nil {
			return nil, &literalError{msg: "OperationMetadata literal is not a decodable JS string: " + err.Error()}
		}
		literals = append(literals, []byte(inner))
		rest = rest[end+1:]
	}
	if len(literals) == 0 {
		return nil, &literalError{msg: "OperationMetadata call not found"}
	}
	return literals, nil
}

// extractFirstOperationMetadataLiteral returns the decoded metadata JSON of the
// first OperationMetadata call, ready for json.Unmarshal.
func extractFirstOperationMetadataLiteral(data []byte) ([]byte, error) {
	literals, err := extractAllOperationMetadataLiterals(data)
	if err != nil {
		return nil, err
	}
	return literals[0], nil
}

// extractOperationMetadataJSON decodes every OperationMetadata literal in the
// build output and joins them with newlines, so a substring assertion can scan
// the metadata regardless of which controller method carries it.
func extractOperationMetadataJSON(t *testing.T, data []byte) string {
	t.Helper()
	literals, err := extractAllOperationMetadataLiterals(data)
	if err != nil {
		t.Fatalf("could not locate __OperationMetadata literal: %v\n%s", err, data)
	}
	parts := make([]string, len(literals))
	for i, literal := range literals {
		parts[i] = string(literal)
	}
	return strings.Join(parts, "\n")
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
		filepath.Join(root, "packages/sdk/native/cmd/ttsc-nestia-sdk"),
		"build",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--emit",
		"--outDir", outDir,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/sdk/native")
	cmd.Env = append(os.Environ(), sdkLinkedPluginsEnv)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(emittedJSPath(t, root, outDir, filepath.Join(sourceRoot, "controllers/TransactionController.ts")))
	if err != nil {
		t.Fatal(err)
	}
	if text := string(js); !strings.Contains(text, `TransactionController`) {
		t.Fatalf("emitted JavaScript is missing the controller class\n%s", text)
	}
	meta := extractOperationMetadataJSON(t, js)
	if !strings.Contains(meta, `"PubkeyInput"`) {
		t.Fatalf("local type alias import metadata is missing %q\n%s", `"PubkeyInput"`, meta)
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
