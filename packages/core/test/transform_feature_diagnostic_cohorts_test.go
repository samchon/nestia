package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestTransformFeatureDiagnosticCohorts verifies every test-sdk error feature
// whose failure is a transform diagnostic reports exactly its expected
// diagnostics, in one in-process transform over all of them.
//
// The features compiled through `nestia all` in test-sdk, an end-to-end run of
// the CLI, ttsc, and the generators for what only the core transform decides.
// They stay fixtures under tests/test-sdk/features; the transform alone reads
// them here.
//
//  1. List every controller of each cohort's features in one program.
//  2. Run the project-mode transform and collect its diagnostics.
//  3. Assert each feature reports its expected count, and nothing else does.
//
// @evidence contracts/testing.md#behavioral-verification Two in-process project cohorts must report exactly each feature's authored diagnostic count and no additional diagnostic, so one feature's failures cannot substitute for another's missing rejection.
// @evidence contracts/testing.md#independent-expectations Each handwritten invalid controller declares the counted unsupported parameters or responses. Per-feature file provenance and the literal counts identify expected rejection populations; counts alone do not pin every message.
// @evidence contracts/testing.md#distinguishing-cases The error and MCP cohorts retain separate named execution and every original feature count. The diagnostic-message test pins nested-form/query and acceptor reason text; accepted transforms remain in their positive cases.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformFeatureDiagnosticCohorts(t *testing.T) {
	for name, cases := range map[string]map[string]int{
		"error": {
			"body-error-generic":                2,
			"body-error-json":                   1,
			"headers-error-array":               1,
			"headers-error-atomic":              1,
			"headers-error-property-array":      1,
			"headers-error-property-nullable":   1,
			"headers-error-property-single":     1,
			"headers-error-union-object":        1,
			"headers-error-union-property":      1,
			"param-error-array":                 1,
			"param-error-generic":               1,
			"param-error-native":                1,
			"param-error-object":                1,
			"param-error-union":                 1,
			"param-error-union-literal":         1,
			"plain-error-any":                   1,
			"plain-error-nullable":              1,
			"plain-error-number":                1,
			"plain-error-object":                1,
			"query-error-array":                 1,
			"query-error-atomic":                1,
			"query-error-generic":               1,
			"query-error-native":                1,
			"query-error-union-array":           1,
			"query-error-union-literal":         1,
			"query-error-union-object":          1,
			"query-error-union-property":        1,
			"route-error-generic":               1,
			"route-error-json":                  1,
			"websocket-error-invalid-acceptor":  1,
			"websocket-error-invalid-driver":    1,
			"websocket-error-invalid-parameter": 1,
			"websocket-error-no-acceptor":       1,
		},
		"mcp": {
			"mcp-error-extra-parameter":           1,
			"mcp-error-missing-params-decorator":  1,
			"mcp-error-multiple-params":           1,
			"mcp-error-no-params":                 1,
			"mcp-error-param-dynamic-properties":  2,
			"mcp-error-param-non-object":          2,
			"mcp-error-return-dynamic-properties": 1,
			"mcp-error-return-non-object":         1,
			"mcp-error-return-union-void-object":  1,
		},
	} {
		t.Run(name, func(t *testing.T) {
			diagnostics := transformFeatureCohort(t, cases)
			for feature, expected := range cases {
				actual := 0
				for _, file := range diagnostics {
					if strings.Contains(file, "/features/"+feature+"/src/controllers/") {
						actual++
					}
				}
				if actual != expected {
					t.Errorf("%s reported %d diagnostics; expected %d", feature, actual, expected)
				}
			}
			total := 0
			for _, expected := range cases {
				total += expected
			}
			if len(diagnostics) != total {
				t.Errorf("the cohort reported %d diagnostics; expected %d:\n%s", len(diagnostics), total, strings.Join(diagnostics, "\n"))
			}
		})
	}
}

// TestTransformFeatureDiagnosticMessages verifies the test-sdk error features
// whose transform diagnostic names what it rejects report exactly one
// diagnostic, carrying each expected phrase.
//
//  1. Transform each feature's controllers.
//  2. Assert one diagnostic, holding every expected phrase.
func transformFeatureCohort(t *testing.T, cases map[string]int) []string {
	t.Helper()
	files := []string{}
	for _, diagnostic := range transformFeatureDiagnostics(t, cases) {
		files = append(files, diagnostic.file)
	}
	return files
}

type featureDiagnostic struct {
	file    string
	message string
}

// transformFeatureDiagnostics runs the project-mode transform over the
// controllers of the given test-sdk features, returning each diagnostic.
func transformFeatureDiagnostics(t *testing.T, cases map[string]int) []featureDiagnostic {
	t.Helper()
	root := filepath.Join(repoRootForCore(t), "tests", "test-sdk")
	files := []string{}
	for feature := range cases {
		matches, err := filepath.Glob(filepath.Join(root, "features", feature, "src", "controllers", "*.ts"))
		if err != nil || len(matches) == 0 {
			t.Fatalf("%s has no controller: %v", feature, err)
		}
		for _, file := range matches {
			files = append(files, `"`+filepath.ToSlash(file)+`"`)
		}
	}
	tsconfig := filepath.Join(t.TempDir(), "tsconfig.json")
	body := `{
  "extends": "` + filepath.ToSlash(filepath.Join(repoRootForCore(t), "tests", "config", "tsconfig.json")) + `",
  "compilerOptions": { "paths": {} },
  "files": [` + strings.Join(files, ", ") + `],
  "include": []
}`
	if err := os.WriteFile(tsconfig, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	stdout, stderr, _ := runCoreNative([]string{
		"transform",
		"--cwd", root,
		"--tsconfig", tsconfig,
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}}]`,
	})
	var output struct {
		Diagnostics []struct {
			File    *string `json:"file"`
			Message string  `json:"messageText"`
		} `json:"diagnostics"`
	}
	if err := json.Unmarshal([]byte(stdout), &output); err != nil {
		t.Fatalf("transform output is no project envelope: %v\n%s\n%s", err, stdout, stderr)
	}
	diagnostics := make([]featureDiagnostic, 0, len(output.Diagnostics))
	for _, diagnostic := range output.Diagnostics {
		file := "<no file>"
		if diagnostic.File != nil {
			file = filepath.ToSlash(*diagnostic.File)
		}
		diagnostics = append(diagnostics, featureDiagnostic{file: file, message: diagnostic.Message})
	}
	return diagnostics
}
