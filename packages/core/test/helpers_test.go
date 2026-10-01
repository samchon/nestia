package test

import (
	"bytes"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

type llmRouteBuildProject struct {
	Root        string
	OutDir      string
	BuildInfo   string
	Manifest    string
	PluginsJSON string
}

type llmRouteBuildProjectOptions struct {
	NoEmit                     bool
	AllowImportingTsExtensions bool
	Valid                      bool
}

// repoRootForCore walks up from the external test module directory
// (packages/core/test) to the monorepo root so the in-process tests can point
// a tsconfig `extends` at the shared tests/test-sdk-e2e feature fixtures.
func repoRootForCore(t *testing.T) string {
	t.Helper()
	root, err := filepath.Abs("../../..")
	if err != nil {
		t.Fatal(err)
	}
	return root
}

// featureRootForCore returns the absolute path of a tests/test-sdk-e2e feature.
func featureRootForCore(t *testing.T, feature string) string {
	t.Helper()
	return filepath.Join(repoRootForCore(t), "tests/test-sdk-e2e/features", feature)
}

// coreNativePlugins composes a @nestia/core plugin manifest with the given
// validate / stringify modes. Mirrors the manifest the ttsc wrapper publishes.
func coreNativePlugins(validate, stringify string) string {
	return `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"` +
		validate + `","stringify":"` + stringify + `"}}]`
}

// transformFileToString drives the in-process transform subcommand against a
// single controller inside a feature whose own tsconfig already wires its
// `@api` paths, routing the rewritten TypeScript to an --out file and returning
// its contents. The external test module cannot read the binary's unexported
// stdout writer, so --out is the only observable seam on the emitted source.
//
// It fails the test on any nonzero exit so feature assertions stay one-liners.
func transformFileToString(t *testing.T, feature, controller, validate, stringify string) string {
	t.Helper()
	return transformFileToStringWithPlugins(t, feature, controller, coreNativePlugins(validate, stringify))
}

// transformFileToStringWithPlugins is transformFileToString with an explicit
// plugin manifest, used when a test needs llm or stringify variants the simple
// helper does not express.
func transformFileToStringWithPlugins(t *testing.T, feature, controller, pluginsJSON string) string {
	t.Helper()
	cwd := featureRootForCore(t, feature)
	outPath := filepath.Join(t.TempDir(), "out.ts")
	code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(cwd, "src/controllers", controller),
		"--out", outPath,
		"--plugins-json", pluginsJSON,
	})
	if code != 0 {
		t.Fatalf("transform.Run exited %d for %s/%s", code, feature, controller)
	}
	data, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatalf("--out file for %s/%s was not written: %v", feature, controller, err)
	}
	return string(data)
}

// mustContainAll asserts every needle appears in haystack, failing with the
// missing needle and the full haystack for diagnosis.
func mustContainAll(t *testing.T, haystack string, needles ...string) {
	t.Helper()
	for _, needle := range needles {
		if !strings.Contains(haystack, needle) {
			t.Fatalf("output missing %q\n%s", needle, haystack)
		}
	}
}

// writeLlmRouteBuildProject creates an isolated TypeScript project whose
// @nestia/core declaration is deliberately minimal: the native transform only
// needs the real module specifier and decorator shape, while the return DTO
// remains fully visible to the checker. Invalid projects use a tuple because
// JSON supports it but the LLM schema does not, isolating the llm option from
// ordinary response-stringifier validation.
func writeLlmRouteBuildProject(t *testing.T, options llmRouteBuildProjectOptions) llmRouteBuildProject {
	t.Helper()
	root := t.TempDir()
	src := filepath.Join(root, "src")
	if err := os.MkdirAll(src, 0o755); err != nil {
		t.Fatal(err)
	}
	declaration := `declare module "@nestia/core" {
  export namespace TypedRoute {
    function Get(): MethodDecorator;
  }
}
`
	if err := os.WriteFile(filepath.Join(src, "core.d.ts"), []byte(declaration), 0o644); err != nil {
		t.Fatal(err)
	}
	property := `pair: [string, number];`
	value := `{ pair: ["one", 1] }`
	if options.Valid {
		property = `value: string;`
		value = `{ value: "ok" }`
	}
	source := `import { TypedRoute } from "@nestia/core";

interface IResponse {
  ` + property + `
}

export class Controller {
  @TypedRoute.Get()
  public get(): IResponse {
    return ` + value + `;
  }
}
`
	if err := os.WriteFile(filepath.Join(src, "main.ts"), []byte(source), 0o644); err != nil {
		t.Fatal(err)
	}
	noEmit := ""
	if options.NoEmit {
		noEmit = `,
    "noEmit": true`
	}
	allowImporting := ""
	if options.AllowImportingTsExtensions {
		allowImporting = `,
    "allowImportingTsExtensions": true`
	}
	buildInfo := filepath.Join(root, "cache.tsbuildinfo")
	config := `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "ignoreDeprecations": "6.0",
    "experimentalDecorators": true,
    "strict": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "cache.tsbuildinfo"` + noEmit + allowImporting + `
  },
  "files": ["src/core.d.ts", "src/main.ts"]
}
`
	if err := os.WriteFile(filepath.Join(root, "tsconfig.json"), []byte(config), 0o644); err != nil {
		t.Fatal(err)
	}
	return llmRouteBuildProject{
		Root:      root,
		OutDir:    filepath.Join(root, "dist"),
		BuildInfo: buildInfo,
		Manifest:  filepath.Join(root, "artifacts", "manifest.json"),
		PluginsJSON: `[{
  "name": "@nestia/core",
  "stage": "transform",
  "config": {
    "transform": "@nestia/core/lib/transform",
    "validate": "assert",
    "stringify": "assert",
    "llm": true
  }
}]`,
	}
}

// runCoreNative captures both process streams around one in-process native
// command. Tests stay sequential because RunWithOutput temporarily redirects
// package-global writers.
func runCoreNative(args []string) (string, string, int) {
	var out bytes.Buffer
	var errOut bytes.Buffer
	code := transform.RunWithOutput(args, &out, &errOut)
	return out.String(), errOut.String(), code
}

// writeExtendingTsconfig writes a tsconfig under temp that extends a feature
// fixture, pins rootDir to the feature src, wires the `@api` paths the feature
// controllers import, and lists the given source files. Returns the tsconfig
// path. Mirrors the project-shaped fixture setup the build / project paths need.
func writeExtendingTsconfig(t *testing.T, temp, featureRoot string, extraCompilerOptions string, files []string) string {
	t.Helper()
	sourceRoot := filepath.Join(featureRoot, "src")
	quoted := make([]string, 0, len(files))
	for _, f := range files {
		quoted = append(quoted, `"`+filepath.ToSlash(f)+`"`)
	}
	tsconfig := filepath.Join(temp, "tsconfig.json")
	body := `{
  "extends": "` + filepath.ToSlash(filepath.Join(featureRoot, "tsconfig.json")) + `",
  "compilerOptions": {
    "rootDir": "` + filepath.ToSlash(sourceRoot) + `"` + extraCompilerOptions + `,
    "paths": {
      "@api": ["` + filepath.ToSlash(filepath.Join(sourceRoot, "api")) + `"],
      "@api/lib/*": ["` + filepath.ToSlash(filepath.Join(sourceRoot, "api/*")) + `"]
    }
  },
  "files": [
    ` + strings.Join(quoted, ",\n    ") + `
  ],
  "include": []
}`
	if err := os.WriteFile(tsconfig, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	return tsconfig
}

var (
	decoratorCallStart     = regexp.MustCompile(`@(?:core\.)?[A-Z][A-Za-z0-9_.]*\(`)
	validatorDiscriminator = regexp.MustCompile(`type: "(assert|is|validate\.log|validate|stringify)"`)
)

// decoratorValidatorTypes returns, for every emitted call of the decorators
// whose name matches pattern, the first validator discriminator
// (`type: "assert"`, `type: "is"`, ...) written between that call and the next
// decorator call, or "" when the call carries none. A whole-output substring
// check cannot tell which decorator wrote a discriminator, because the route
// and parameter decorators of one controller share the same plugin options.
func decoratorValidatorTypes(out, pattern string) []string {
	name := regexp.MustCompile(`^(?:` + pattern + `)\($`)
	starts := decoratorCallStart.FindAllStringIndex(out, -1)
	types := []string{}
	for i, start := range starts {
		if !name.MatchString(out[start[0]:start[1]]) {
			continue
		}
		end := len(out)
		if i+1 < len(starts) {
			end = starts[i+1][0]
		}
		found := validatorDiscriminator.FindStringSubmatch(out[start[0]:end])
		if found == nil {
			types = append(types, "")
		} else {
			types = append(types, found[1])
		}
	}
	return types
}

// mustDecorateAll asserts the output contains at least one call of the
// decorators matching pattern and that every one of them carries the want
// validator discriminator as its own argument.
func mustDecorateAll(t *testing.T, out, pattern, want string) {
	t.Helper()
	types := decoratorValidatorTypes(out, pattern)
	if len(types) == 0 {
		t.Fatalf("output has no %s call\n%s", pattern, out)
	}
	for index, got := range types {
		if got != want {
			t.Fatalf("%s call #%d carries validator type %q, want %q\n%s", pattern, index, got, want, out)
		}
	}
}

// typedParamCounts counts the emitted @core.TypedParam calls, those that carry
// an injected caster as their second argument, and those whose caster closes
// with the validate-report flag `}, true)`. The flag text also occurs inside
// the generated typia code, so only the closing of a caster counts.
func typedParamCounts(out string) (calls, casters, flagged int) {
	calls = len(regexp.MustCompile(`@core\.TypedParam\(`).FindAllString(out, -1))
	casters = len(regexp.MustCompile(`@core\.TypedParam\("[^"]+", \(input: string\)`).FindAllString(out, -1))
	flagged = strings.Count(out, "}, true)")
	return
}

// decoratorSpans returns the emitted text of every call of the decorators whose
// name matches pattern: from the call to the next decorator call.
func decoratorSpans(out, pattern string) []string {
	name := regexp.MustCompile(`^(?:` + pattern + `)\($`)
	starts := decoratorCallStart.FindAllStringIndex(out, -1)
	spans := []string{}
	for i, start := range starts {
		if !name.MatchString(out[start[0]:start[1]]) {
			continue
		}
		end := len(out)
		if i+1 < len(starts) {
			end = starts[i+1][0]
		}
		spans = append(spans, out[start[0]:end])
	}
	return spans
}

// mustSpansContain asserts every call of the matching decorators carries each
// needle in its own emitted text.
func mustSpansContain(t *testing.T, out, pattern string, needles ...string) {
	t.Helper()
	spans := decoratorSpans(out, pattern)
	if len(spans) == 0 {
		t.Fatalf("output has no %s call\n%s", pattern, out)
	}
	for index, span := range spans {
		for _, needle := range needles {
			if !strings.Contains(span, needle) {
				t.Fatalf("%s call #%d does not emit %q", pattern, index, needle)
			}
		}
	}
}

// mustSpansOmit asserts no call of the matching decorators carries any needle.
func mustSpansOmit(t *testing.T, out, pattern string, needles ...string) {
	t.Helper()
	for index, span := range decoratorSpans(out, pattern) {
		for _, needle := range needles {
			if strings.Contains(span, needle) {
				t.Fatalf("%s call #%d unexpectedly emits %q", pattern, index, needle)
			}
		}
	}
}
