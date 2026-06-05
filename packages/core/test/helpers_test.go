package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// repoRootForCore walks up from the external test module directory
// (packages/core/test) to the monorepo root so the in-process tests can point
// a tsconfig `extends` at the shared tests/test-sdk feature fixtures.
func repoRootForCore(t *testing.T) string {
	t.Helper()
	root, err := filepath.Abs("../../..")
	if err != nil {
		t.Fatal(err)
	}
	return root
}

// featureRootForCore returns the absolute path of a tests/test-sdk feature.
func featureRootForCore(t *testing.T, feature string) string {
	t.Helper()
	return filepath.Join(repoRootForCore(t), "tests/test-sdk/features", feature)
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
