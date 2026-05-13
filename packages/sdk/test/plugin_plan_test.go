package test

import (
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
    "rootDir": "`+filepath.ToSlash(sourceRoot)+`",
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
	js, err := os.ReadFile(filepath.Join(outDir, "controllers/TypedBodyController.js"))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	for _, expected := range []string{
		`const __OperationMetadata = require("@nestia/sdk");`,
		`__OperationMetadata.OperationMetadata(`,
		`core_1.default.TypedRoute.Put(":id", ({`,
		`core_1.default.TypedBody(({`,
		`name: "IBbsArticle.IUpdate"`,
		`elements: [`,
		`"IBbsArticle"`,
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
    "rootDir": "`+filepath.ToSlash(sourceRoot)+`",
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
	js, err := os.ReadFile(filepath.Join(outDir, "controllers/ExceptionController.js"))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	for _, expected := range []string{
		`exceptions: [`,
		`name: "TypeGuardError"`,
		`name: "INotFound"`,
		`name: "IUnprocessibleEntity"`,
		`name: "IInternalServerError"`,
		`name: "throws"`,
		`text: "400 invalid request"`,
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
    "rootDir": "`+filepath.ToSlash(sourceRoot)+`",
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
	js, err := os.ReadFile(filepath.Join(outDir, "controllers/TypedBodyController.js"))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	expected := "success: {\n        type: {\n            name: \"__type\"\n        },\n        imports: [],"
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
	expected := "jsDocTags: [\n    {\n        name: \"security\"\n    },\n    {\n        name: \"security\",\n        text: ["
	if !strings.Contains(text, expected) {
		t.Fatalf("empty JSDoc tag should omit text so Swagger can emit optional security\n%s", text)
	}
}

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
    "rootDir": "`+filepath.ToSlash(sourceRoot)+`",
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
	js, err := os.ReadFile(filepath.Join(outDir, "controllers/TransactionController.js"))
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
