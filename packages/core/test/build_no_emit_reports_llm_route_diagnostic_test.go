package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestBuildNoEmitReportsLlmRouteDiagnostic verifies every analysis-only entry
// path runs the same @TypedRoute LLM validation as an emitting build.
//
// A tuple response is valid JSON but invalid as an LLM schema. Before this
// regression fix, check, an explicit --noEmit, and tsconfig-owned noEmit all
// returned success before the core transformer ran, contradicting the runtime
// error's advice to use `ttsc --noEmit` for the underlying diagnostic.
//
//  1. Create equivalent tuple-return TypedRoute projects for all no-emit paths.
//  2. Require the preserved source location, decorator code, and LLM reason.
//  3. Prove every analysis-only path publishes no compiler artifact.
func TestBuildNoEmitReportsLlmRouteDiagnostic(t *testing.T) {
	cases := []struct {
		name       string
		configured bool
		verbose    bool
		command    func(llmRouteBuildProject) []string
	}{
		{
			name: "check-command",
			command: func(project llmRouteBuildProject) []string {
				return []string{
					"check",
					"--cwd", project.Root,
					"--tsconfig", "tsconfig.json",
					"--manifest", project.Manifest,
					"--plugins-json", project.PluginsJSON,
				}
			},
		},
		{
			name:    "explicit-no-emit",
			verbose: true,
			command: func(project llmRouteBuildProject) []string {
				return []string{
					"build",
					"--cwd", project.Root,
					"--tsconfig", "tsconfig.json",
					"--noEmit",
					"--manifest", project.Manifest,
					"--verbose",
					"--plugins-json", project.PluginsJSON,
				}
			},
		},
		{
			name:       "configured-no-emit",
			configured: true,
			command: func(project llmRouteBuildProject) []string {
				return []string{
					"build",
					"--cwd", project.Root,
					"--tsconfig", "tsconfig.json",
					"--manifest", project.Manifest,
					"--plugins-json", project.PluginsJSON,
				}
			},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{
				NoEmit: tc.configured,
			})
			out, errText, code := runCoreNative(tc.command(project))
			if code != 3 {
				t.Fatalf("analysis-only LLM transform should fail with code 3, got %d\nstdout=%s\nstderr=%s", code, out, errText)
			}
			normalized := filepath.ToSlash(errText)
			mustContainAll(t, normalized,
				"src/main.ts:8:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
				"- IResponse.pair: [string, number]",
				"- LLM schema does not support tuple type.",
			)
			if strings.Contains(errText, "JSON does not support tuple type") {
				t.Fatalf("tuple witness should isolate the LLM validator:\n%s", errText)
			}
			if tc.verbose {
				if !strings.Contains(out, "emit=false") {
					t.Fatalf("verbose no-emit summary missing:\n%s", out)
				}
			} else if strings.TrimSpace(out) != "" {
				t.Fatalf("quiet no-emit run wrote stdout:\n%s", out)
			}
			for _, path := range []string{project.OutDir, project.BuildInfo, project.Manifest} {
				if _, err := os.Stat(path); !os.IsNotExist(err) {
					t.Fatalf("analysis-only run published %s: %v", path, err)
				}
			}
		})
	}
}
