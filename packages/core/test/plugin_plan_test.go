package test

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
	typiaprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers"
)

func TestParsePlanDetectsNestiaAndTypia(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"typia","stage":"transform","config":{"transform":"typia/lib/transform"}},
		{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}},
		{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.Core {
		t.Fatal("expected @nestia/core transform to be detected")
	}
	if !plan.SDK {
		t.Fatal("expected @nestia/sdk transform to be detected")
	}
	if !plan.Typia {
		t.Fatal("expected typia transform to be detected")
	}
	if !plan.UsesNestia() {
		t.Fatal("expected plan to report a Nestia transform")
	}
	if len(plan.Entries) != 3 {
		t.Fatalf("expected 3 plugin entries, got %d", len(plan.Entries))
	}
}

func TestTypiaProgrammersAreReusableFromVendoredSnapshot(t *testing.T) {
	_ = typiaprogrammers.ValidateProgrammer
	_ = typiaprogrammers.AssertProgrammer
}

func TestCoreNativeTransformInjectsDecoratorArguments(t *testing.T) {
	root := repoRoot(t)
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", filepath.Join(root, "tests/test-sdk"),
		"--tsconfig", "features/body/tsconfig.json",
		"--file", "features/body/src/controllers/TypedBodyController.ts",
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`@core.TypedRoute.Post(({`,
		`@core.TypedRoute.Put(":id", ({`,
		`@core.TypedParam("id", ((input) =>`,
		// TypedParam's third argument is the `validate?: boolean` flag from
		// packages/core/src/decorators/TypedParam.ts; when validate-family
		// modes are active the transform appends `true` so the runtime emits
		// the detailed report shape.
		`}), true)`,
		`@core.TypedBody(({`,
		`_validateReport`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
}

func TestCoreNativeTransformUsesValidateLogStringifier(t *testing.T) {
	root := repoRoot(t)
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", filepath.Join(root, "tests/test-sdk"),
		"--tsconfig", "features/body/tsconfig.json",
		"--file", "features/body/src/controllers/TypedBodyController.ts",
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"validate.log"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`@core.TypedRoute.Post(({`,
		`type: "validate.log"`,
		`validate: (() =>`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
	if strings.Contains(text, `validate.log: `) {
		t.Fatalf("validate.log must be emitted as the stringifier type, not a property name\n%s", text)
	}
}

func TestCoreNativeBuildKeepsDecoratorTypiaRewritesInEmitOrder(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/swagger-example")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/BbsArticlesController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IBbsArticle.ts"))+`"
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
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	js, err := os.ReadFile(filepath.Join(outDir, "controllers/BbsArticlesController.js"))
	if err != nil {
		t.Fatal(err)
	}
	text := string(js)
	start := strings.Index(text, "SwaggerExample.Response((() =>")
	end := strings.Index(text[start:], "core_1.default.TypedRoute.Post")
	if start < 0 || end < 0 {
		t.Fatalf("could not locate create response decorator\n%s", text)
	}
	response := text[start : start+end]
	for _, expected := range []string{
		`id:`,
		`created_at:`,
	} {
		if !strings.Contains(response, expected) {
			t.Fatalf("response example rewrite is missing %q\n%s", expected, response)
		}
	}
}

func TestCoreNativeBuildEmitsControllersAfterSkippingBadRewriteCandidates(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/clone-and-keyword")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/UserNormalsController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/ErrorCode.ts"))+`"
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
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native build failed: %v\n%s", err, out)
	}
	if _, err := os.Stat(filepath.Join(outDir, "controllers/UserNormalsController.js")); err != nil {
		t.Fatalf("UserNormalsController.js was not emitted: %v\n%s", err, out)
	}
}

func TestCoreNativeTransformAppliesJSDocTypeTagsToTypedQuery(t *testing.T) {
	root := repoRoot(t)
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", filepath.Join(root, "tests/test-sdk/features/app"),
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(root, "tests/test-sdk/features/app/src/controllers/BbsArticlesController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`__typia_transform__isTypeUint32(input.page)`,
		`__typia_transform__isTypeUint32(input.limit)`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
}

func TestCoreNativeTypiaRandomUsesJSDocTypeTags(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/app")
	sourceRoot := filepath.Join(featureRoot, "src")
	fixture := filepath.Join(sourceRoot, "test/transform_random_uint_fixture.ts")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
  "files": [
    "`+filepath.ToSlash(fixture)+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IPage.ts"))+`"
  ],
  "include": []
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", fixture,
		"--plugins-json", `[{"name":"typia","stage":"transform","config":{"transform":"typia/lib/transform"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`_randomInteger`,
		`type: "integer"`,
		`minimum: 0`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
	if strings.Contains(text, `_randomNumber`) {
		t.Fatalf("random generator must use integer constraints for @type uint\n%s", text)
	}
}

func TestCoreNativeTransformInjectsFormDataFileOptions(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/multipart-form-data")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/MultipartController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IMultipart.ts"))+`"
  ],
  "include": []
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(sourceRoot, "controllers/MultipartController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`@core.TypedFormData.Body(() => Multer(), ({`,
		`name: "blob"`,
		`name: "blobs"`,
		`name: "file"`,
		`name: "files"`,
		`limit: 1`,
		`limit: null`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
}

func TestCoreNativeTransformUsesQuerifyForTypedQueryRoute(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/query")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/QueryController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IBigQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/INestQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IQuery.ts"))+`"
  ],
  "include": []
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(sourceRoot, "controllers/QueryController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("native transform failed: %v\n%s", err, out)
	}
	text := string(out)
	for _, expected := range []string{
		`@TypedQuery.Post("body", ({`,
		`const output = new URLSearchParams();`,
		`output.append("limit", input.limit);`,
		`input.values.forEach((elem) => output.append("values", elem));`,
		`return stringify(assert(input));`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed source is missing %q\n%s", expected, text)
		}
	}
}

func TestCoreNativeTransformReportsStrictNullChecksDisabled(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/query")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
	if err := os.WriteFile(
		tsconfig,
		[]byte(`{
  "extends": "`+filepath.ToSlash(filepath.Join(featureRoot, "tsconfig.json"))+`",
  "compilerOptions": {
    "rootDir": "`+filepath.ToSlash(sourceRoot)+`",
    "strictNullChecks": false,
    "paths": {
      "@api": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api"))+`"],
      "@api/lib/*": ["`+filepath.ToSlash(filepath.Join(sourceRoot, "api/*"))+`"]
    }
  },
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/QueryController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IBigQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/INestQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IQuery.ts"))+`"
  ],
  "include": []
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(sourceRoot, "controllers/QueryController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected native transform to fail when strictNullChecks is disabled\n%s", out)
	}
	if !strings.Contains(string(out), `strict mode is required.`) {
		t.Fatalf("unexpected diagnostic output\n%s", out)
	}
}

func TestCoreNativeTransformReportsLlmQueryRouteViolation(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/query")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
  "files": [
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/QueryController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IBigQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/INestQuery.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/IQuery.ts"))+`"
  ],
  "include": []
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(sourceRoot, "controllers/QueryController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert","llm":{"strict":true}}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected native transform to fail for strict LLM query metadata\n%s", out)
	}
	if !strings.Contains(string(out), `Strict mode does not support optional property in object.`) {
		t.Fatalf("unexpected diagnostic output\n%s", out)
	}
}

func TestCoreNativeTransformReportsInvalidWebSocketDriver(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "tests/test-sdk/features/websocket-error-invalid-driver")
	sourceRoot := filepath.Join(featureRoot, "src")
	tsconfig := filepath.Join(temp, "tsconfig.json")
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
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "controllers/CalculateController.ts"))+`",
    "`+filepath.ToSlash(filepath.Join(sourceRoot, "api/structures/**/*.ts"))+`"
  ]
}`),
		0o644,
	); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(
		"go",
		"run",
		filepath.Join(root, "packages/core/native/cmd/ttsc-nestia"),
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(sourceRoot, "controllers/CalculateController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`,
	)
	cmd.Dir = filepath.Join(root, "packages/core/native")
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected native transform to fail for invalid WebSocket driver\n%s", out)
	}
	if !strings.Contains(string(out), `parameter "driver" must have Driver<Listener> type.`) {
		t.Fatalf("unexpected diagnostic output\n%s", out)
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
